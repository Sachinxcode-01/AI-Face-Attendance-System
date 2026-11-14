#!/usr/bin/env python3
"""
SmartFace Elite — Automated Supabase Database Backup Utility
===========================================================
Dumps PostgreSQL tables from Supabase into a timestamped JSON/SQL archive.

Usage:
    python scripts/supabase_backup.py

Requirements:
    pip install psycopg2-binary python-dotenv
    (or pg_dump installed on PATH)
"""

import os
import sys
import json
import gzip
import logging
from datetime import datetime, timezone
from pathlib import Path

# Load environment
base_dir = Path(__file__).resolve().parent.parent
env_paths = [
    base_dir / "backend" / "api" / ".env",
    base_dir / ".env"
]

db_url = None
for p in env_paths:
    if p.exists():
        with open(p, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
        if db_url:
            break

if not db_url:
    db_url = os.environ.get("DATABASE_URL")

if not db_url:
    logging.error("DATABASE_URL is not set in environment or .env file.")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def backup_tables():
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError:
        logging.error("psycopg2 is not installed. Install via: pip install psycopg2-binary")
        sys.exit(1)

    backup_dir = base_dir / "backups" / "supabase"
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    output_file = backup_dir / f"supabase_backup_{timestamp}.json.gz"

    tables = ["students", "face_embeddings", "sessions", "attendance_logs"]
    data = {}

    logging.info("Connecting to Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        for table in tables:
            try:
                cur.execute(f"SELECT * FROM public.{table};")
                rows = cur.fetchall()
                # Convert non-serializable fields (like datetime and UUID) to string
                cleaned_rows = []
                for row in rows:
                    cleaned_rows.append({k: str(v) if v is not None and not isinstance(v, (int, float, bool, list, dict)) else v for k, v in row.items()})
                data[table] = cleaned_rows
                logging.info(f"✓ Backed up {len(cleaned_rows)} records from table '{table}'")
            except Exception as te:
                logging.warning(f"Could not read table '{table}' (may not exist yet): {te}")
                conn.rollback()

        cur.close()
        conn.close()

        with gzip.open(output_file, "wt", encoding="utf-8") as gf:
            json.dump({"timestamp": timestamp, "tables": data}, gf, indent=2)

        logging.info(f"🎉 Backup successfully saved to: {output_file}")
    except Exception as e:
        logging.error(f"Backup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    backup_tables()

