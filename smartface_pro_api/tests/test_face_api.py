import hashlib
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from smartface_pro_api.app.main import app
from smartface_pro_api.app.config import AI_INTERNAL_TOKEN, BASE_DIR

client = TestClient(app)

# Expected immutable hashes
EXPECTED_ATTENDANCE_HASH = "B1C5A52382782AEA937E73FAE9E686FFC95BE00C8165AF15223600F3B576296E"
EXPECTED_TRAIN_HASH = "4BF26AE2A36EFB186FDB606E3FD0263D3878FE990995033219C6C267346AD7ED"


def get_file_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest().upper()


def test_immutable_core_files_hashes():
    """Verify core/attendance_system.py and core/train_faces.py remain 100% byte-for-byte unchanged."""
    attendance_path = BASE_DIR / "core" / "attendance_system.py"
    train_path = BASE_DIR / "core" / "train_faces.py"

    assert attendance_path.exists(), "attendance_system.py missing!"
    assert train_path.exists(), "train_faces.py missing!"

    current_attendance_hash = get_file_sha256(attendance_path)
    current_train_hash = get_file_sha256(train_path)

    assert current_attendance_hash == EXPECTED_ATTENDANCE_HASH, (
        f"CRITICAL IMMUTABILITY VIOLATION: core/attendance_system.py was modified! "
        f"Expected {EXPECTED_ATTENDANCE_HASH}, got {current_attendance_hash}"
    )

    assert current_train_hash == EXPECTED_TRAIN_HASH, (
        f"CRITICAL IMMUTABILITY VIOLATION: core/train_faces.py was modified! "
        f"Expected {EXPECTED_TRAIN_HASH}, got {current_train_hash}"
    )


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "smartface_pro_api"


def test_missing_internal_token():
    files = {"image": ("test.jpg", b"fake_image_bytes", "image/jpeg")}
    response = client.post("/v1/face/verify", files=files)
    assert response.status_code == 401
    assert "Missing required X-Internal-Token" in response.json()["detail"]


def test_invalid_internal_token():
    files = {"image": ("test.jpg", b"fake_image_bytes", "image/jpeg")}
    headers = {"X-Internal-Token": "invalid_token_123"}
    response = client.post("/v1/face/verify", files=files, headers=headers)
    assert response.status_code == 401
    assert "Invalid internal security token" in response.json()["detail"]


def test_empty_image():
    files = {"image": ("test.jpg", b"", "image/jpeg")}
    headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
    response = client.post("/v1/face/verify", files=files, headers=headers)
    assert response.status_code == 400
    assert "Empty image content provided" in response.json()["detail"]


def test_unsupported_mime_type():
    files = {"image": ("test.txt", b"some text", "text/plain")}
    headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
    response = client.post("/v1/face/verify", files=files, headers=headers)
    assert response.status_code == 400
    assert "Unsupported image file format" in response.json()["detail"]


def test_oversized_image():
    # Generate 6MB payload (exceeds default 5MB limit)
    large_bytes = b"0" * (6 * 1024 * 1024)
    files = {"image": ("large.jpg", large_bytes, "image/jpeg")}
    headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
    response = client.post("/v1/face/verify", files=files, headers=headers)
    assert response.status_code == 400
    assert "exceeds max limit" in response.json()["detail"]


def test_malformed_image():
    # Valid MIME header but corrupted image bytes
    files = {"image": ("corrupted.jpg", b"NOT_AN_IMAGE_HEADER_123456789", "image/jpeg")}
    headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
    response = client.post("/v1/face/verify", files=files, headers=headers)
    assert response.status_code == 400
    assert "Invalid or malformed image data" in response.json()["detail"]
