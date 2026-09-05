import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parents[2] # Project Root directory
DATA_DIR = BASE_DIR / "data"

# Environment Configurations
AI_INTERNAL_TOKEN = os.getenv("AI_INTERNAL_TOKEN", "secure_internal_ai_token_key_789")
MAX_IMAGE_SIZE_MB = float(os.getenv("MAX_IMAGE_SIZE_MB", "5.0"))
FACE_INFERENCE_TIMEOUT_SECONDS = float(os.getenv("FACE_INFERENCE_TIMEOUT_SECONDS", "15.0"))
FACE_INFERENCE_CONCURRENCY = int(os.getenv("FACE_INFERENCE_CONCURRENCY", "2"))
ENABLE_FACE_TRAINING = os.getenv("ENABLE_FACE_TRAINING", "false").lower() in ("true", "1", "yes")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
