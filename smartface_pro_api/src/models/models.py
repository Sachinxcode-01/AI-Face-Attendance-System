from pydantic import BaseModel, EmailStr
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
    full_name: str = None
    phone: str = None
    department: str = None
    dob: str = None
    college: str = None
    semester: str = None
    student_id: str = None

class BiometricRequest(BaseModel):
    email: str

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    name: str
    role: str = "student"

class IntruderAlert(BaseModel):
    location: Optional[str] = None
    camera_id: Optional[str] = None
    type: Optional[str] = None
    image_base64: Optional[str] = None

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

class AttendanceRecord(BaseModel):
    user_id: str
    timestamp: datetime
    status: str # present, absent, late
    session_id: str
    verified_by: str # face, qr, manual

class AttendanceMark(BaseModel):
    student_email: str
    session_id: str
    qr_code: str

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


class FaceRegisterRequest(BaseModel):
    images: List[str]  # Base64 string data of scanned angles


