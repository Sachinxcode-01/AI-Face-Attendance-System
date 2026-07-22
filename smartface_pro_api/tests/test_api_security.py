import pytest
from pydantic import ValidationError
from smartface_pro_api.src.models.models import FaceRegisterRequest, IntruderAlert


def test_valid_face_register_request():
    # Valid base64 image string within 5MB
    valid_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    req = FaceRegisterRequest(images=[valid_b64])
    assert len(req.images) == 1


def test_oversized_image_rejection():
    # Construct base64 string larger than 5MB limit (~7MB)
    large_b64 = "a" * (8 * 1024 * 1024)
    with pytest.raises(ValidationError) as excinfo:
        IntruderAlert(image_base64=large_b64)
    assert "exceeds maximum allowed limit" in str(excinfo.value)


def test_invalid_mime_type_rejection():
    invalid_mime_b64 = "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
    with pytest.raises(ValidationError) as excinfo:
        IntruderAlert(image_base64=invalid_mime_b64)
    assert "Unsupported or invalid image MIME type" in str(excinfo.value)


def test_malformed_base64_rejection():
    malformed_b64 = "!!!NotBase64Data!!!"
    with pytest.raises(ValidationError) as excinfo:
        IntruderAlert(image_base64=malformed_b64)
    assert "Malformed base64 image data" in str(excinfo.value)


def test_empty_face_register_images_rejection():
    with pytest.raises(ValidationError) as excinfo:
        FaceRegisterRequest(images=[])
    assert "At least one face image is required" in str(excinfo.value)
