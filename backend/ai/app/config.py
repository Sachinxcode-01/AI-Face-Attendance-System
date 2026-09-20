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
AI_INTERNAL_TOKEN = os.getenv("AI_INTERNAL_TOKEN", "secure_internal_ai_token_key_789")
MAX_IMAGE_SIZE_MB = float(os.getenv("MAX_IMAGE_SIZE_MB", "5.0"))
FACE_INFERENCE_TIMEOUT_SECONDS = float(os.getenv("FACE_INFERENCE_TIMEOUT_SECONDS", "15.0"))
FACE_INFERENCE_CONCURRENCY = int(os.getenv("FACE_INFERENCE_CONCURRENCY", "2"))
ENABLE_FACE_TRAINING = os.getenv("ENABLE_FACE_TRAINING", "false").lower() in ("true", "1", "yes")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
