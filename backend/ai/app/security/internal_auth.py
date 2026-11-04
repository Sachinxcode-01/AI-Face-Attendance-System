import hmac
from typing import Optional
from fastapi import Header, HTTPException, status
try:
    from backend.ai.app.config import AI_INTERNAL_TOKEN
except (ImportError, ModuleNotFoundError):
    try:
        from app.config import AI_INTERNAL_TOKEN
    except (ImportError, ModuleNotFoundError):
        from smartface_pro_api.app.config import AI_INTERNAL_TOKEN

def verify_internal_token(x_internal_token: Optional[str] = Header(None, alias="X-Internal-Token")) -> str:
    """
    Validates X-Internal-Token header using constant-time string comparison.
    """
    if not x_internal_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required X-Internal-Token security header"
        )
    
    if not hmac.compare_digest(x_internal_token, AI_INTERNAL_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal security token"
        )
        
    return x_internal_token
