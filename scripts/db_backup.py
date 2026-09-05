#!/usr/bin/env python3
"""
SmartFace Elite — Automated MongoDB Backup Utility
====================================================
Dumps all MongoDB collections into a timestamped GZIP-compressed JSON archive.

Usage:
    python scripts/db_backup.py [--collections users attendance sessions leaves notifications]

Output:
    backups/smartface_backup_YYYY-MM-DD_HH-MM-SS.tar.gz

Requirements:
    pip install pymongo python-dotenv
"""

import os
import sys
import json
import gzip
import tarfile
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path

# ── Try to load dotenv ──────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    # Walk up from scripts/ to find .env files
    base = Path(__file__).resolve().parent.parent
    for env_path in [base / "backend" / "api" / ".env",
                     base / "backend" / "ai" / ".env",
                     base / "smartface_node_api" / ".env",
                     base / "smartface_pro_api" / ".env",
                     base / ".env"]:
        if env_path.exists():
            load_dotenv(env_path)
            break
except ImportError:
    pass  # dotenv optional; rely on environment variables

# ── Try to load pymongo ─────────────────────────────────────────────────────
try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
except ImportError:
    print("❌ pymongo not installed. Run: pip install pymongo")
    sys.exit(1)

# ── Logging setup ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger("smartface.backup")


# ── Constants ───────────────────────────────────────────────────────────────
DEFAULT_COLLECTIONS = [
    "users",
    "attendance",
    "sessions",
    "leaves",
    "notifications",
    "security_logs",
    "login_otps",
]

BACKUP_DIR = Path(__file__).resolve().parent.parent / "backups"


def _get_mongo_uri() -> str:
    """Resolve MONGODB_URL from environment, with a sensible local fallback."""
    uri = (
        os.getenv("MONGODB_URL")
        or os.getenv("MONGO_URI")
        or "mongodb://localhost:27017/smartface"
    )
    return uri


def _sanitise_for_json(doc: dict) -> dict:
    """Convert BSON types that are not JSON-serialisable to safe equivalents."""
    import bson  # available with pymongo
    result = {}
    for k, v in doc.items():
        if isinstance(v, bson.ObjectId):
            result[k] = str(v)
        elif isinstance(v, datetime):
            result[k] = v.isoformat()
        elif isinstance(v, dict):
            result[k] = _sanitise_for_json(v)
        elif isinstance(v, list):
            result[k] = [
                _sanitise_for_json(i) if isinstance(i, dict) else (
                    str(i) if hasattr(i, "__class__") and i.__class__.__name__ == "ObjectId" else i
                )
                for i in v
            ]
        else:
            result[k] = v
    return result


def backup(collections: list[str], dry_run: bool = False) -> Path | None:
    """
    Connect to MongoDB, dump each requested collection to a JSON file,
    and bundle everything into a timestamped .tar.gz archive.

    Returns the path to the archive on success, or None on failure.
    """
    uri = _get_mongo_uri()
    # Mask credentials in log output
    safe_uri = uri.split("@")[-1] if "@" in uri else uri

    log.info("🔌 Connecting to MongoDB (%s)…", safe_uri)
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=8000)
        client.admin.command("ping")
    except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
        log.error("❌ Cannot reach MongoDB: %s", exc)
        return None

    # Derive DB name from URI or default to 'smartface'
    db_name = uri.rsplit("/", 1)[-1].split("?")[0] or "smartface"
    db = client[db_name]

    timestamp = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    archive_name = f"smartface_backup_{timestamp}.tar.gz"
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    archive_path = BACKUP_DIR / archive_name

    if dry_run:
        log.info("🔍 DRY RUN — would write to: %s", archive_path)
        client.close()
        return archive_path

    log.info("📦 Starting backup → %s", archive_path)
    stats: dict[str, int] = {}

    with tarfile.open(archive_path, "w:gz") as tar:
        for col_name in collections:
            col = db[col_name]
            docs = list(col.find({}))
            if not docs:
                log.warning("⚠  Collection '%s' is empty — skipping.", col_name)
                stats[col_name] = 0
                continue

            sanitised = [_sanitise_for_json(d) for d in docs]
            json_bytes = json.dumps(sanitised, ensure_ascii=False, indent=2).encode("utf-8")

            # Write to a gzip member inside the tar
            gz_name = f"{col_name}.json.gz"
            gz_path = BACKUP_DIR / gz_name
            with gzip.open(gz_path, "wb") as gz_f:
                gz_f.write(json_bytes)

            tar.add(gz_path, arcname=gz_name)
            gz_path.unlink()  # remove temp file

            stats[col_name] = len(docs)
            log.info("  ✅  %-22s  %4d documents", col_name, len(docs))

        # Write a metadata manifest
        manifest = {
            "backup_timestamp": timestamp,
            "database": db_name,
            "collections": stats,
            "tool": "SmartFace Elite db_backup v1.0",
        }
        manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")
        manifest_path = BACKUP_DIR / "manifest.json"
        manifest_path.write_bytes(manifest_bytes)
        tar.add(manifest_path, arcname="manifest.json")
        manifest_path.unlink()

    client.close()

    total = sum(stats.values())
    log.info("🎉 Backup complete: %d documents across %d collections → %s",
             total, len([c for c in stats if stats[c] > 0]), archive_path)
    return archive_path


def prune_old_backups(keep: int = 7) -> None:
    """Delete all but the `keep` most-recent backup archives."""
    archives = sorted(BACKUP_DIR.glob("smartface_backup_*.tar.gz"), reverse=True)
    for old in archives[keep:]:
        old.unlink()
        log.info("🗑  Pruned old backup: %s", old.name)


# ── CLI entry-point ─────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(
        description="SmartFace Elite — MongoDB Backup Utility"
    )
    parser.add_argument(
        "--collections",
        nargs="+",
        default=DEFAULT_COLLECTIONS,
        metavar="COLLECTION",
        help="MongoDB collection names to back up (default: all SmartFace collections)",
    )
    parser.add_argument(
        "--keep",
        type=int,
        default=7,
        metavar="N",
        help="Number of recent backups to retain (default: 7)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would happen without writing any files",
    )
    args = parser.parse_args()

    result = backup(args.collections, dry_run=args.dry_run)
    if result is None:
        sys.exit(1)

    if not args.dry_run:
        prune_old_backups(keep=args.keep)


if __name__ == "__main__":
    main()
