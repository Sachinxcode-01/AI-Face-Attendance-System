import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Depends, Security

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "smartface_ultra_secure_secret_999")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def verify_password(plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None

    @staticmethod
    async def get_current_user(auth: HTTPAuthorizationCredentials = Security(HTTPBearer())):
        from src.config.database import db
        # Check if token is blocklisted
        revoked = await db.revoked_tokens.find_one({"token": auth.credentials})
        if revoked:
            raise HTTPException(status_code=401, detail="Token has been revoked")
            
        payload = AuthService.decode_token(auth.credentials)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return payload.get("sub")
