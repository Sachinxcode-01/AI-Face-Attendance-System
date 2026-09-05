from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerification(BaseModel):
    email: str
    otp: str

class PasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AIQuery(BaseModel):
    email: str
    query: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    language_preference: Optional[str] = None
    
    # Student fields
    usn: Optional[str] = None
    student_id: Optional[str] = None
    course: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    parent_details: Optional[str] = None
    parent_email: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    college: Optional[str] = None

    # Teacher fields
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None

    # Parent fields
    child_email: Optional[str] = None
    child_name: Optional[str] = None
    alert_preferences: Optional[dict] = None

    # Admin fields
    institution_name: Optional[str] = None
    system_access_level: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=8)

class NotificationSettingsUpdate(BaseModel):
    attendance_alerts: Optional[bool] = None
    leave_alerts: Optional[bool] = None
    security_alerts: Optional[bool] = None
    system_announcements: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    in_app_notifications: Optional[bool] = Field(None, alias="in_app_notifications")
    daily_digest: Optional[bool] = None
    ward_activity: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None



class BiometricRequest(BaseModel):
    email: str

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    name: str
    role: str = "student"
    avatar_url: Optional[str] = None

import base64
import re
from pydantic import validator

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB limit


def validate_base64_image(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    if not isinstance(v, str):
        raise ValueError("Image payload must be a string")

    max_b64_len = int(MAX_IMAGE_SIZE_BYTES * 1.4) + 200
    if len(v) > max_b64_len:
        raise ValueError("Image payload size exceeds maximum allowed limit of 5MB")

    data = v
    if "," in v:
        header, data = v.split(",", 1)
        if not re.match(r"^data:image/(jpeg|png|webp|jpg);base64$", header, re.IGNORECASE):
            raise ValueError("Unsupported or invalid image MIME type")

    try:
        decoded = base64.b64decode(data)
        if len(decoded) > MAX_IMAGE_SIZE_BYTES:
            raise ValueError("Decoded image payload exceeds 5MB size limit")
    except Exception as exc:
        raise ValueError("Malformed base64 image data") from exc

    return v


from pydantic import field_validator

class IntruderAlert(BaseModel):
    location: Optional[str] = None
    camera_id: Optional[str] = None
    type: Optional[str] = None
    image_base64: Optional[str] = None

    @field_validator("image_base64")
    @classmethod
    def validate_image(cls, v):
        return validate_base64_image(v)


class FaceRegisterRequest(BaseModel):
    images: List[str] = Field(..., min_length=1, max_length=10)

    @field_validator("images", mode="before")
    @classmethod
    def validate_images_list(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one face image is required")
        if isinstance(v, list):
            for img in v:
                validate_base64_image(img)
        return v


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str # admin, teacher, student, parent
    child_emails: Optional[List[str]] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    biometric_registered: Optional[bool] = False
    setup_completed: Optional[bool] = False
    profile_completed: Optional[bool] = False
    intro_completed: Optional[bool] = False
    wizard_step: Optional[int] = 0
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class AttendanceRecord(BaseModel):
    user_id: str
    timestamp: datetime
    status: str # present, absent, late
    session_id: str
    verified_by: str # face, qr, manual

class AttendanceMark(BaseModel):
    student_email: EmailStr
    session_id: str = Field(..., min_length=1)
    qr_code: str = Field(..., min_length=1)

class SessionCreate(BaseModel):
    teacher_email: str
    subject: str

class SessionStart(BaseModel):
    teacher_email: str
    subject: str

class LeaveRequest(BaseModel):
    student_email: str
    reason: str
    start_date: str
    end_date: str

class LeaveApplication(BaseModel):
    user_id: str
    reason: str
    start_date: datetime
    end_date: datetime
    status: str = "Pending" # Pending, Under Review, Approved, Rejected
    document_url: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = datetime.utcnow()

class Notification(BaseModel):
    user_id: str
    title: str
    message: str
    type: str # attendance, leave, security, announcement
    is_read: bool = False
    created_at: datetime = datetime.utcnow()

class FaceAttendanceMark(BaseModel):
    student_email: str
    confidence: float

class SessionStop(BaseModel):
    session_id: str

class LoginSessionResponse(BaseModel):
    session_id: str
    user_email: str
    device_id: str
    ip_address: str
    user_agent: str
    created_at: datetime
    last_active: datetime
    is_active: bool

class DeviceTrack(BaseModel):
    device_id: str
    user_email: str
    user_agent: str
    ip_address: str
    device_type: str
    os_name: str
    browser_name: str
    last_active: datetime


class CompleteProfileRequest(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[str] = None
    student_id: Optional[str] = None
    phone: Optional[str] = None


