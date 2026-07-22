from typing import Optional
from pydantic import BaseModel, Field

class FaceVerifyResponse(BaseModel):
    success: bool = Field(..., description="Whether processing completed successfully")
    matched: bool = Field(..., description="Whether the face was recognized and matched expected student identity")
    confidence: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    student_email: Optional[str] = Field(None, description="Recognized student email address")
    message: str = Field(..., description="Status summary message")

class FaceTrainResponse(BaseModel):
    success: bool = Field(..., description="Whether face training completed successfully")
    message: str = Field(..., description="Status summary message")
