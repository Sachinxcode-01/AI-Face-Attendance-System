import asyncio
import sys
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status

try:
    from backend.ai.app.config import ENABLE_FACE_TRAINING
    from backend.ai.app.security.internal_auth import verify_internal_token
    from backend.ai.app.schemas.face import FaceTrainResponse
except (ImportError, ModuleNotFoundError):
    try:
        from app.config import ENABLE_FACE_TRAINING
        from app.security.internal_auth import verify_internal_token
        from app.schemas.face import FaceTrainResponse
    except (ImportError, ModuleNotFoundError):
        from smartface_pro_api.app.config import ENABLE_FACE_TRAINING
        from smartface_pro_api.app.security.internal_auth import verify_internal_token
        from smartface_pro_api.app.schemas.face import FaceTrainResponse

router = APIRouter(prefix="/v1/admin/faces", tags=["Admin Face Training"])

training_lock = asyncio.Lock()


@router.post("/train", response_model=FaceTrainResponse)
async def train_faces_endpoint(
    internal_token: str = Depends(verify_internal_token),
):
    """
    Protected administrative route to trigger face dataset encoding training.
    Disabled by default via ENABLE_FACE_TRAINING flag.
    Executes core.train_faces.run_training safely under process lock.
    """
    if not ENABLE_FACE_TRAINING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Face training is disabled in server environment configuration"
        )

    if training_lock.locked():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Face training process is already in progress"
        )

    async with training_lock:
        try:
            # Ensure project root is in sys.path
            project_root = str(Path(__file__).resolve().parents[3])
            if project_root not in sys.path:
                sys.path.insert(0, project_root)

            import core.train_faces as train_module

            loop = asyncio.get_running_loop()
            success = await loop.run_in_executor(None, train_module.run_training)

            if success:
                return FaceTrainResponse(
                    success=True,
                    message="Face encodings training completed successfully"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Face training completed with errors or zero encodings generated"
                )
        except HTTPException:
            raise
        except Exception as err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Face training execution error: {str(err)}"
            )
