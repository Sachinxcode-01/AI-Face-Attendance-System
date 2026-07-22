import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

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

# Semaphore for bounded inference concurrency
inference_semaphore = asyncio.Semaphore(FACE_INFERENCE_CONCURRENCY)


@router.post("/verify", response_model=FaceVerifyResponse)
async def verify_face_endpoint(
    image: UploadFile = File(...),
    student_email: Optional[str] = Form(None),
    internal_token: str = Depends(verify_internal_token),
):
    """
    Internal face verification route.
    Validates security header, image payload bounds, MIME types, and calls legacy adapter.
    """
    # 1. Validate MIME type
    content_type = (image.content_type or "").lower()
    file_ext = (image.filename or "").split(".")[-1].lower() if image.filename else ""
    
    is_valid_mime = content_type in ALLOWED_MIME_TYPES or file_ext in ("jpg", "jpeg", "png", "webp")
    if not is_valid_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image file format or MIME type: {content_type}"
        )

    # 2. Read image bytes and validate size
    image_bytes = await image.read()
    max_bytes = int(MAX_IMAGE_SIZE_MB * 1024 * 1024)
    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded image size ({len(image_bytes)} bytes) exceeds max limit of {MAX_IMAGE_SIZE_MB} MB"
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image content provided"
        )

    # 3. Perform inference under semaphore and timeout bounds
    adapter = LegacyAttendanceAdapter.get_instance()

    try:
        async with inference_semaphore:
            loop = asyncio.get_running_loop()
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    adapter.verify_face,
                    image_bytes,
                    student_email
                ),
                timeout=FACE_INFERENCE_TIMEOUT_SECONDS
            )

        if not result.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Face verification failed")
            )

        return FaceVerifyResponse(
            success=result["success"],
            matched=result["matched"],
            confidence=result["confidence"],
            student_email=result.get("student_email"),
            message=result["message"]
        )

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Face recognition inference timed out"
        )
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face verification internal failure: {str(err)}"
        )
