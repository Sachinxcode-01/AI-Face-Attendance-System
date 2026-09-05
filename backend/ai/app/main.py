import os
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from smartface_pro_api.app.routes.face import router as face_router
from smartface_pro_api.app.routes.train import router as train_router
from smartface_pro_api.app.adapters.legacy_attendance_adapter import LegacyAttendanceAdapter
from smartface_pro_api.app.security.internal_auth import verify_internal_token

app_env = os.getenv("APP_ENV", os.getenv("NODE_ENV", "development")).lower()
is_production = app_env == "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager:
    Pre-warms the InsightFace model and face encodings on application startup,
    and performs graceful cleanup on application shutdown.
    """
    print("[INFO] Starting SmartFace AI Pro Service...")
    try:
        adapter = LegacyAttendanceAdapter.get_instance()
        if adapter.is_ready():
            print("[INFO] InsightFace model and face encodings loaded successfully.")
        else:
            print("[WARN] LegacyAttendanceAdapter initialized but model/encodings are not fully ready.")
    except Exception as err:
        print(f"[ERROR] Lifespan model startup pre-warming failed: {err}")

    yield

    print("[INFO] Gracefully shutting down SmartFace AI Pro Service resources.")


app = FastAPI(
    title="SmartFace AI Pro - Python Face Service",
    description="FastAPI service exposing legacy ArcFace recognition adapter to Node.js gateway.",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json"
)

# Configure Restrictive CORS
cors_env = os.getenv("CORS_ORIGINS", os.getenv("CORS_ORIGIN", ""))
if is_production:
    if not cors_env or cors_env.strip() == "*":
        # Production fail-closed: do not allow wildcard CORS in production
        origins = []
    else:
        origins = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    origins = [o.strip() for o in cors_env.split(",") if o.strip()] if cors_env else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Internal-Token", "Content-Type", "Authorization"],
)

# Mount Routers
app.include_router(face_router)
app.include_router(train_router)


@app.get("/health", tags=["Health & Diagnostics"])
async def health_check():
    """Public minimal health check."""
    return {"status": "ok"}


@app.get("/ready", tags=["Health & Diagnostics"])
async def readiness_check():
    """Public minimal readiness check."""
    try:
        adapter = LegacyAttendanceAdapter.get_instance()
        if adapter.is_ready():
            return {"status": "ready"}
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service unavailable"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service unavailable"
        )


@app.get("/internal/health", tags=["Internal Diagnostics"])
async def internal_health_check(internal_token: str = Depends(verify_internal_token)) -> Dict[str, Any]:
    """
    Authenticated internal health and diagnostics endpoint.
    Exposes operational metrics without leaking student IDs, counts, or file paths.
    """
    try:
        adapter = LegacyAttendanceAdapter.get_instance()
        ready = adapter.is_ready()
        return {
            "status": "ready" if ready else "unavailable",
            "service": "smartface_pro_api",
            "version": "2.0.0",
            "model_loaded": ready,
            "provider": "CPUExecutionProvider" if not getattr(adapter.system, "using_gpu", False) else "CUDAExecutionProvider",
            "worker_saturation": 0.0
        }
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Internal health check failure: {str(err)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
