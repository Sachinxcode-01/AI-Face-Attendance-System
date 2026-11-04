import asyncio
import time
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

try:
    from backend.ai.app.config import (
        ALLOWED_MIME_TYPES,
        FACE_INFERENCE_CONCURRENCY,
        FACE_INFERENCE_TIMEOUT_SECONDS,
        MAX_IMAGE_SIZE_MB,
    )
    from backend.ai.app.security.internal_auth import verify_internal_token
    from backend.ai.app.schemas.face import FaceVerifyResponse
    from backend.ai.app.adapters.legacy_attendance_adapter import LegacyAttendanceAdapter
except (ImportError, ModuleNotFoundError):
    try:
        from app.config import (
            ALLOWED_MIME_TYPES,
            FACE_INFERENCE_CONCURRENCY,
            FACE_INFERENCE_TIMEOUT_SECONDS,
            MAX_IMAGE_SIZE_MB,
        )
        from app.security.internal_auth import verify_internal_token
        from app.schemas.face import FaceVerifyResponse
        from app.adapters.legacy_attendance_adapter import LegacyAttendanceAdapter
    except (ImportError, ModuleNotFoundError):
        from smartface_pro_api.app.config import (
            ALLOWED_MIME_TYPES,
            FACE_INFERENCE_CONCURRENCY,
            FACE_INFERENCE_TIMEOUT_SECONDS,
            MAX_IMAGE_SIZE_MB,
        )
        from smartface_pro_api.app.security.internal_auth import verify_internal_token
        from smartface_pro_api.app.schemas.face import FaceVerifyResponse
        from smartface_pro_api.app.adapters.legacy_attendance_adapter import LegacyAttendanceAdapter

router = APIRouter(prefix="/v1/face", tags=["Face Verification"])

# Semaphore and request queue bounds for inference concurrency
inference_semaphore = asyncio.Semaphore(FACE_INFERENCE_CONCURRENCY)
pending_queue_count = 0

# In-memory sliding window rate limiter per IP (max 15 requests/min)
ip_rate_limits: Dict[str, list] = {}


def check_rate_limit(client_ip: str, max_requests: int = 15, window_seconds: int = 60):
    now = time.time()
    timestamps = ip_rate_limits.get(client_ip, [])
    # Remove timestamps older than window
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded for face verification. Please try again shortly."
        )
    timestamps.append(now)
    ip_rate_limits[client_ip] = timestamps


def validate_magic_bytes(header_bytes: bytes) -> bool:
    """Validates file magic numbers for JPEG, PNG, and WebP signatures."""
    if len(header_bytes) < 4:
        return False
    if header_bytes.startswith(b"\xff\xd8\xff"):
        return True  # JPEG
    if header_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return True  # PNG
    if header_bytes.startswith(b"RIFF") and len(header_bytes) >= 12 and header_bytes[8:12] == b"WEBP":
        return True  # WebP
    return False


@router.post("/verify", response_model=FaceVerifyResponse)
async def verify_face_endpoint(
    request: Request,
    image: UploadFile = File(...),
    student_email: Optional[str] = Form(None),
    enrolled_vector: Optional[str] = Form(None),
    internal_token: str = Depends(verify_internal_token),
):
    """
    Internal face verification route.
    Validates X-Internal-Token header, Content-Length, file magic bytes, payload size bounds,
    and calls legacy adapter safely under concurrency semaphore.
    Supports 1:1 verification when enrolled_vector is provided.
    """
    global pending_queue_count

    # 1. Per-IP Rate Limit Check
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)

    # 2. Content-Length Pre-Check (HTTP 413)
    content_length = request.headers.get("content-length")
    max_bytes = int(MAX_IMAGE_SIZE_MB * 1024 * 1024)
    if content_length:
        try:
            if int(content_length) > max_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded payload size exceeds maximum limit of {MAX_IMAGE_SIZE_MB} MB"
                )
        except ValueError:
            pass

    # 3. Streamed Chunk Reading with strict size limit (HTTP 413)
    image_bytes = bytearray()
    chunk_size = 64 * 1024
    while True:
        chunk = await image.read(chunk_size)
        if not chunk:
            break
        image_bytes.extend(chunk)
        if len(image_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded payload size exceeds maximum limit of {MAX_IMAGE_SIZE_MB} MB"
            )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image content provided"
        )

    # 4. MIME & File Signature Magic Byte Validation (HTTP 415)
    content_type = (image.content_type or "").lower()
    file_ext = (image.filename or "").split(".")[-1].lower() if image.filename else ""
    is_valid_ext = file_ext in ("jpg", "jpeg", "png", "webp") or content_type in ALLOWED_MIME_TYPES
    is_valid_magic = validate_magic_bytes(bytes(image_bytes[:12]))

    if not is_valid_ext or not is_valid_magic:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media format or invalid file signature"
        )

    # 5. Parse enrolled_vector if provided
    parsed_vector = None
    if enrolled_vector:
        try:
            parsed_vector = json.loads(enrolled_vector)
        except Exception:
            parsed_vector = None

    # 6. Inference Queue Saturation Check (HTTP 429)
    if pending_queue_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Inference worker capacity limit reached. Please retry shortly."
        )

    # 7. Execute inference under semaphore and timeout bounds
    adapter = LegacyAttendanceAdapter.get_instance()

    try:
        pending_queue_count += 1
        async with inference_semaphore:
            loop = asyncio.get_running_loop()
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    adapter.verify_face,
                    bytes(image_bytes),
                    student_email,
                    parsed_vector
                ),
                timeout=FACE_INFERENCE_TIMEOUT_SECONDS
            )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI face recognition request timed out"
        )
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI face recognition service internal error: {str(err)}"
        )
    finally:
        pending_queue_count = max(0, pending_queue_count - 1)
        del image_bytes  # Immediate buffer cleanup

    # Handle status code from adapter
    status_code = result.get("status_code", 200)
    if status_code == 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("detail", "Invalid image payload")
        )

    if status_code == 422 or not result.get("matched", False):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Face verification failed"
        )

    return FaceVerifyResponse(
        success=True,
        matched=True,
        confidence=result.get("confidence", 0.0),
        message=result.get("detail", "Face verification complete")
    )


@router.post("/enroll")
async def enroll_face_endpoint(
    request: Request,
    image: UploadFile = File(...),
    student_email: Optional[str] = Form(None),
    internal_token: str = Depends(verify_internal_token),
):
    """
    Extracts and normalizes a 512-D face embedding vector for database persistence.
    Called during student biometric enrollment to save vector in MongoDB.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)

    max_bytes = int(MAX_IMAGE_SIZE_MB * 1024 * 1024)
    image_bytes = bytearray()
    chunk_size = 64 * 1024
    while True:
        chunk = await image.read(chunk_size)
        if not chunk:
            break
        image_bytes.extend(chunk)
        if len(image_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded payload size exceeds maximum limit of {MAX_IMAGE_SIZE_MB} MB"
            )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image content provided"
        )

    content_type = (image.content_type or "").lower()
    file_ext = (image.filename or "").split(".")[-1].lower() if image.filename else ""
    is_valid_ext = file_ext in ("jpg", "jpeg", "png", "webp") or content_type in ALLOWED_MIME_TYPES
    is_valid_magic = validate_magic_bytes(bytes(image_bytes[:12]))

    if not is_valid_ext or not is_valid_magic:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media format or invalid file signature"
        )

    adapter = LegacyAttendanceAdapter.get_instance()
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, adapter.extract_embedding, bytes(image_bytes))

    if result.get("status_code", 200) != 200:
        raise HTTPException(
            status_code=result.get("status_code", 400),
            detail=result.get("detail", "Face enrollment failed")
        )

    return {
        "success": True,
        "message": "Face embedding extracted successfully",
        "embedding": result.get("embedding"),
        "confidence": 1.0
    }

