import os
import sys
import threading
from pathlib import Path
from typing import Optional, Dict, Any
import numpy as np
import cv2

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
        """Returns True if the underlying model and encodings are loaded."""
        try:
            return (
                hasattr(self.system, "app")
                and self.system.app is not None
                and len(self.system.known_face_encodings) > 0
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
        """
        if not image_bytes:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "student_email": None,
                "message": "Empty image provided"
            }

        # 1. Decode image bytes using OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None or img.size == 0:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "student_email": None,
                "message": "Invalid or malformed image data"
            }

        # 2. Extract face embeddings via InsightFace app
        try:
            faces = self.system.app.get(img)
        except Exception as err:
            return {
                "success": False,
                "matched": False,
                "confidence": 0.0,
                "student_email": None,
                "message": f"Face detection inference error: {str(err)}"
            }

        if not faces or len(faces) == 0:
            return {
                "success": True,
                "matched": False,
                "confidence": 0.0,
                "student_email": None,
                "message": "No face detected in image"
            }

        # Select largest face if multiple faces are present
        faces = sorted(
            faces,
            key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]),
            reverse=True
        )
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
                "success": True,
                "matched": False,
                "confidence": 0.0,
                "student_email": None,
                "message": "No known face encodings loaded in database"
            }

        sims = np.dot(known_encodings, norm_emb)
        best_idx = int(np.argmax(sims))
        best_sim = float(sims[best_idx])

        threshold = self.system.confidence_threshold # Default 0.6

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
                    return {
                        "success": True,
                        "matched": True,
                        "confidence": round(best_sim, 4),
                        "student_email": detected_email,
                        "message": "Face verified successfully"
                    }
                else:
                    return {
                        "success": True,
                        "matched": False,
                        "confidence": round(best_sim, 4),
                        "student_email": detected_email,
                        "message": f"Face identity mismatch: recognized as {detected_email} instead of {expected_student_email}"
                    }
            else:
                return {
                    "success": True,
                    "matched": True,
                    "confidence": round(best_sim, 4),
                    "student_email": detected_email,
                    "message": "Face recognized successfully"
                }

        else:
            return {
                "success": True,
                "matched": False,
                "confidence": round(best_sim, 4),
                "student_email": None,
                "message": "Face not recognized (below similarity threshold)"
            }
