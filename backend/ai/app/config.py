import os
from pathlib import Path


# Base Paths
def _find_project_root() -> Path:
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / "core" / "attendance_system.py").exists():
            return parent
    return Path(__file__).resolve().parents[3]


BASE_DIR = _find_project_root()
DATA_DIR = BASE_DIR / "data"

# Environment Configurations
_app_env = os.getenv("APP_ENV", os.getenv("NODE_ENV", "development")).lower()
_raw_internal_token = os.getenv("AI_INTERNAL_TOKEN", "")
if _app_env == "production" and not _raw_internal_token.strip():
    raise RuntimeError("CRITICAL SECURITY ERROR: AI_INTERNAL_TOKEN must be set in production.")
AI_INTERNAL_TOKEN = _raw_internal_token or "dev_internal_ai_token_local_only"
MAX_IMAGE_SIZE_MB = float(os.getenv("MAX_IMAGE_SIZE_MB", "5.0"))
FACE_INFERENCE_TIMEOUT_SECONDS = float(os.getenv("FACE_INFERENCE_TIMEOUT_SECONDS", "15.0"))
FACE_INFERENCE_CONCURRENCY = int(os.getenv("FACE_INFERENCE_CONCURRENCY", "2"))
ENABLE_FACE_TRAINING = os.getenv("ENABLE_FACE_TRAINING", "false").lower() in ("true", "1", "yes")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
