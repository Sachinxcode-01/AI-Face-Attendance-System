import unittest
from pydantic import ValidationError
from smartface_pro_api.src.models.models import FaceRegisterRequest, IntruderAlert


class TestApiSecurity(unittest.TestCase):
    def test_valid_face_register_request(self):
        valid_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        req = FaceRegisterRequest(images=[valid_b64])
        self.assertEqual(len(req.images), 1)

    def test_oversized_image_rejection(self):
        large_b64 = "a" * (8 * 1024 * 1024)
        with self.assertRaises(ValidationError) as ctx:
            IntruderAlert(image_base64=large_b64)
        self.assertIn("exceeds maximum allowed limit", str(ctx.exception))

    def test_invalid_mime_type_rejection(self):
        invalid_mime_b64 = "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
        with self.assertRaises(ValidationError) as ctx:
            IntruderAlert(image_base64=invalid_mime_b64)
        self.assertIn("Unsupported or invalid image MIME type", str(ctx.exception))

    def test_malformed_base64_rejection(self):
        malformed_b64 = "!!!NotBase64Data!!!"
        with self.assertRaises(ValidationError) as ctx:
            IntruderAlert(image_base64=malformed_b64)
        self.assertIn("Malformed base64 image data", str(ctx.exception))

    def test_empty_face_register_images_rejection(self):
        with self.assertRaises(ValidationError) as ctx:
            FaceRegisterRequest(images=[])
        self.assertIn("At least one face image is required", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
