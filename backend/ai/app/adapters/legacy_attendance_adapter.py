import os
import sys
import threading
from pathlib import Path
from typing import Optional, Dict, Any
import numpy as np
import cv2

# Safe platform mock for winsound when running on Linux containers (e.g. Railway)
if sys.platform != "win32" and "winsound" not in sys.modules:
    from unittest.mock import MagicMock
    sys.modules["winsound"] = MagicMock()

# Ensure project root and core directory are in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
CORE_DIR = PROJECT_ROOT / "core"

for p in (str(PROJECT_ROOT), str(CORE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

import core.attendance_system as legacy_module


class LegacyAttendanceAdapter:
    """
    Non-invasive adapter wrapping core/attendance_system.py without modifying it.
    Loads models once as a singleton and exposes face verification methods.
    """

    _instance: Optional["LegacyAttendanceAdapter"] = None
    _lock: threading.Lock = threading.Lock()

    def __init__(self):
        print("[INFO] Initializing LegacyAttendanceAdapter...")
        # Instantiating SmartAttendanceSystem loads InsightFace model and pickle encodings
        self.system = legacy_module.SmartAttendanceSystem()
        print("[INFO] LegacyAttendanceAdapter ready.")

    @classmethod
    def get_instance(cls) -> "LegacyAttendanceAdapter":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def is_ready(self) -> bool:
        """Returns True if the underlying model, encodings, and student mappings are loaded."""
        try:
            encodings_path = Path(getattr(self.system, "encodings_path", ""))
            student_file = Path(getattr(self.system, "student_details_file", ""))
            return (
                hasattr(self.system, "app")
                and self.system.app is not None
                and hasattr(self.system, "known_face_encodings")
                and self.system.known_face_encodings is not None
                and len(self.system.known_face_encodings) > 0
                and hasattr(self.system, "student_db")
                and self.system.student_db is not None
                and len(self.system.student_db) > 0
                and encodings_path.is_file()
                and student_file.is_file()
            )
        except Exception:
            return False

    def verify_face(
        self,
        image_bytes: bytes,
        expected_student_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extracts face from image bytes and verifies identity against known encodings.
        Enforces strict privacy: never disclosures alternate student identity, names, or vectors.
        """
        req_id = f"req_{os.urandom(4).hex()}"

        if not image_bytes:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "status_code": 400,
                "detail": "Empty image content provided"
            }

        # 1. Decode image bytes using OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None or img.size == 0:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "status_code": 400,
                "detail": "Invalid or malformed image data"
            }

        # Validate maximum resolution (max 4096x4096 / 16 Megapixels)
        h, w = img.shape[:2]
        if w > 4096 or h > 4096 or (w * h) > 16777216:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "status_code": 400,
                "detail": "Image dimensions exceed maximum resolution limits"
            }

        # 2. Extract face embeddings via InsightFace app
        try:
            faces = self.system.app.get(img)
        except Exception as err:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "status_code": 400,
                "detail": f"Face detection inference error: {str(err)}"
            }

        if not faces or len(faces) == 0:
            print(f"[AUDIT {req_id}] Result: MISMATCH | Category: NO_FACE | Student: Masked | Confidence: 0.0")
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "status_code": 422,
                "detail": "Face verification failed"
            }

        if len(faces) > 1:
            print(f"[AUDIT {req_id}] Result: MISMATCH | Category: MULTIPLE_FACES | Student: Masked | Confidence: 0.0")
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "status_code": 422,
                "detail": "Face verification failed"
            }

        target_face = faces[0]

        # 3. Vectorized Cosine Similarity
        embedding = target_face.embedding
        norm = np.linalg.norm(embedding)
        if norm == 0:
            norm_emb = embedding
        else:
            norm_emb = embedding / norm

        known_encodings = self.system.known_face_encodings
        if len(known_encodings) == 0:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "status_code": 422,
                "detail": "Face verification failed"
            }

        sims = np.dot(known_encodings, norm_emb)
        best_idx = int(np.argmax(sims))
        best_sim = float(sims[best_idx])

        threshold = self.system.confidence_threshold # Default 0.6
        conf_rounded = round(best_sim, 4)
        conf_bucket = "HIGH" if conf_rounded >= 0.85 else ("MED" if conf_rounded >= 0.6 else "LOW")

        if best_sim >= threshold:
            best_roll = self.system.known_roll_nos[best_idx]
            best_name = self.system.known_face_names[best_idx]

            # Resolve email from student_db
            student_info = self.system.student_db.get(best_roll, {})
            detected_email = student_info.get("email")

            # Fallback search if email missing in student_db dict
            if not detected_email or detected_email == "no_email@college.edu" or detected_email == "update_email@college.edu":
                for roll_key, info in self.system.student_db.items():
                    if info.get("name") == best_name and info.get("email"):
                        detected_email = info.get("email")
                        break

            detected_email_clean = (detected_email or "").strip().lower()

            if expected_student_email:
                expected_clean = expected_student_email.strip().lower()

                if detected_email_clean and detected_email_clean == expected_clean:
                    masked_student = f"{expected_clean[:2]}***{expected_clean[expected_clean.find('@'):]}" if "@" in expected_clean else "masked"
                    print(f"[AUDIT {req_id}] Result: MATCH | Bucket: {conf_bucket} ({conf_rounded}) | Student: {masked_student}")
                    return {
                        "success": True,
                        "matched": True,
                        "confidence": conf_rounded,
                        "status_code": 200,
                        "detail": "Face verification complete"
                    }
                else:
                    masked_student = f"{expected_clean[:2]}***{expected_clean[expected_clean.find('@'):]}" if "@" in expected_clean else "masked"
                    print(f"[AUDIT {req_id}] Result: MISMATCH | Category: IDENTITY_MISMATCH | Bucket: {conf_bucket} ({conf_rounded}) | Student: {masked_student}")
                    return {
                        "success": False,
                        "matched": False,
                        "confidence": conf_rounded,
                        "status_code": 422,
                        "detail": "Face verification failed"
                    }
            else:
                print(f"[AUDIT {req_id}] Result: MATCH | Bucket: {conf_bucket} ({conf_rounded})")
                return {
                    "success": True,
                    "matched": True,
                    "confidence": conf_rounded,
                    "status_code": 200,
                    "detail": "Face verification complete"
                }

        else:
            print(f"[AUDIT {req_id}] Result: MISMATCH | Category: BELOW_THRESHOLD | Bucket: LOW ({conf_rounded})")
            return {
                "success": False,
                "matched": False,
                "confidence": conf_rounded,
                "status_code": 422,
                "detail": "Face verification failed"
            }
