from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from smartface_pro_api.app.routes.face import router as face_router
from smartface_pro_api.app.routes.train import router as train_router
from smartface_pro_api.app.adapters.legacy_attendance_adapter import LegacyAttendanceAdapter

app = FastAPI(
    title="SmartFace AI Pro - Python Face Service",
    description="FastAPI service exposing legacy ArcFace recognition adapter to Node.js gateway.",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(face_router)
app.include_router(train_router)


@app.get("/health", tags=["Health & Diagnostics"])
async def health_check():
    """Returns basic service health status."""
    return {
        "status": "ok",
        "service": "smartface_pro_api",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/ready", tags=["Health & Diagnostics"])
async def readiness_check():
    """Checks whether the legacy face model and encodings are loaded and ready."""
    try:
        adapter = LegacyAttendanceAdapter.get_instance()
        if adapter.is_ready():
            return {
                "status": "ready",
                "model_loaded": True,
                "encodings_count": len(adapter.system.known_face_encodings)
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Face recognition model or encodings not loaded"
            )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Readiness check failed: {str(err)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
