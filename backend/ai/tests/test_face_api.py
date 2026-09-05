import hashlib
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from smartface_pro_api.app.main import app
from smartface_pro_api.app.config import AI_INTERNAL_TOKEN, BASE_DIR

client = TestClient(app)

EXPECTED_ATTENDANCE_HASH = "FAB857567AB5ABC9D92BF5ADDAADDC20DDB06CBA678A93CF9DD09FB3A911625F"
EXPECTED_TRAIN_HASH = "44B9CAFA99B4C947CB572C15394558660BC702ECE8C63B94FFDA37684AEE1D6E"
VALID_JPEG_HEADER = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"


def get_file_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest().upper()


class TestFaceApi(unittest.TestCase):
    def test_immutable_core_files_hashes(self):
        """Verify core/attendance_system.py and core/train_faces.py remain 100% byte-for-byte unchanged."""
        attendance_path = BASE_DIR / "core" / "attendance_system.py"
        train_path = BASE_DIR / "core" / "train_faces.py"

        self.assertTrue(attendance_path.exists(), "attendance_system.py missing!")
        self.assertTrue(train_path.exists(), "train_faces.py missing!")

        current_attendance_hash = get_file_sha256(attendance_path)
        current_train_hash = get_file_sha256(train_path)

        self.assertEqual(
            current_attendance_hash,
            EXPECTED_ATTENDANCE_HASH,
            f"CRITICAL IMMUTABILITY VIOLATION: core/attendance_system.py was modified! Expected {EXPECTED_ATTENDANCE_HASH}, got {current_attendance_hash}"
        )

        self.assertEqual(
            current_train_hash,
            EXPECTED_TRAIN_HASH,
            f"CRITICAL IMMUTABILITY VIOLATION: core/train_faces.py was modified! Expected {EXPECTED_TRAIN_HASH}, got {current_train_hash}"
        )

    def test_public_health_endpoints_privacy(self):
        """Public /health and /ready return minimal status only."""
        res_health = client.get("/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json(), {"status": "ok"})

        res_ready = client.get("/ready")
        self.assertIn(res_ready.status_code, (200, 503))

    def test_internal_authenticated_health(self):
        """Authenticated /internal/health endpoint exposes internal diagnostics."""
        res_unauth = client.get("/internal/health")
        self.assertEqual(res_unauth.status_code, 401)

        headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
        res_auth = client.get("/internal/health", headers=headers)
        self.assertEqual(res_auth.status_code, 200)
        data = res_auth.json()
        self.assertIn("status", data)
        self.assertIn("version", data)

    def test_missing_internal_token(self):
        files = {"image": ("test.jpg", VALID_JPEG_HEADER + b"fake_image_bytes", "image/jpeg")}
        response = client.post("/v1/face/verify", files=files)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Missing required X-Internal-Token", response.json()["detail"])

    def test_invalid_internal_token(self):
        files = {"image": ("test.jpg", VALID_JPEG_HEADER + b"fake_image_bytes", "image/jpeg")}
        headers = {"X-Internal-Token": "invalid_token_123"}
        response = client.post("/v1/face/verify", files=files, headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid internal security token", response.json()["detail"])

    def test_empty_image(self):
        files = {"image": ("test.jpg", b"", "image/jpeg")}
        headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
        response = client.post("/v1/face/verify", files=files, headers=headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Empty image content provided", response.json()["detail"])

    def test_unsupported_mime_or_magic_bytes(self):
        files = {"image": ("test.txt", b"some plain text data", "text/plain")}
        headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
        response = client.post("/v1/face/verify", files=files, headers=headers)
        self.assertEqual(response.status_code, 415)
        self.assertIn("Unsupported media format", response.json()["detail"])

    def test_oversized_image_returns_413(self):
        large_bytes = VALID_JPEG_HEADER + b"0" * (6 * 1024 * 1024)
        files = {"image": ("large.jpg", large_bytes, "image/jpeg")}
        headers = {"X-Internal-Token": AI_INTERNAL_TOKEN}
        response = client.post("/v1/face/verify", files=files, headers=headers)
        self.assertEqual(response.status_code, 413)
        self.assertIn("exceeds maximum limit", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
