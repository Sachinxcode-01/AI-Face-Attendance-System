import asyncio
import os
import sys
import time
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Ensure we can load modules from the project workspace
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from smartface_pro_api.src.auth.auth_service import AuthService
from smartface_pro_api.src.config.db_indexes import create_indexes

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

async def seed():
    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.smartface
    
    print("Clearing existing database collections...")
    await db.users.delete_many({})
    await db.attendance.delete_many({})
    await db.sessions.delete_many({})
    await db.notifications.delete_many({})
    await db.leaves.delete_many({})
    await db.security_logs.delete_many({})
    await db.login_otps.delete_many({})
    await db.login_sessions.delete_many({})
    await db.audit_logs.delete_many({})
    await db.login_logs.delete_many({})
    await db.devices.delete_many({})
    
    print("Creating database indexes...")
    await create_indexes(db)
    
    # 1. Hashed password for users
    hashed_password = AuthService.get_password_hash("password123")
    
    # 2. Seed Users
    print("Seeding users...")
    users = [
        # Super Admin
        {
            "email": "superadmin@smartface.pro",
            "full_name": "Super Administrator",
            "role": "super_admin",
            "password": hashed_password,
            "created_at": datetime.utcnow()
        },
        # Admin
        {
            "email": "admin@smartface.pro",
            "full_name": "Principal Admin",
            "role": "admin",
            "password": hashed_password,
            "created_at": datetime.utcnow()
        },
        # Teacher
        {
            "email": "teacher@smartface.pro",
            "full_name": "Dr. Sarah Jenkins",
            "role": "teacher",
            "password": hashed_password,
            "created_at": datetime.utcnow()
        },
        # Students
        {
            "email": "alice@smartface.pro",
            "full_name": "Alice Cooper",
            "role": "student",
            "password": hashed_password,
            "semester": "6th",
            "department": "Computer Science",
            "student_id": "CS2301",
            "phone": "+1234567890",
            "college": "SmartFace Engineering College",
            "dob": "2003-05-15",
            "biometric_registered": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "bob@smartface.pro",
            "full_name": "Bob Dylan",
            "role": "student",
            "password": hashed_password,
            "semester": "4th",
            "department": "AI & Data Science",
            "student_id": "AI2405",
            "phone": "+1234567891",
            "college": "SmartFace Engineering College",
            "dob": "2004-08-22",
            "biometric_registered": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "charlie@smartface.pro",
            "full_name": "Charlie Parker",
            "role": "student",
            "password": hashed_password,
            "semester": "6th",
            "department": "Computer Science",
            "student_id": "CS2312",
            "phone": "+1234567892",
            "college": "SmartFace Engineering College",
            "dob": "2003-11-02",
            "biometric_registered": False,
            "created_at": datetime.utcnow()
        },
        {
            "email": "david@smartface.pro",
            "full_name": "David Bowie",
            "role": "student",
            "password": hashed_password,
            "semester": "2nd",
            "department": "Information Science",
            "student_id": "IS2503",
            "phone": "+1234567893",
            "college": "SmartFace Engineering College",
            "dob": "2005-01-30",
            "biometric_registered": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "eve@smartface.pro",
            "full_name": "Eve Adams",
            "role": "student",
            "password": hashed_password,
            "semester": "4th",
            "department": "AI & Data Science",
            "student_id": "AI2412",
            "phone": "+1234567894",
            "college": "SmartFace Engineering College",
            "dob": "2004-03-12",
            "biometric_registered": True,
            "created_at": datetime.utcnow()
        },
        # Parent
        {
            "email": "parent@smartface.pro",
            "full_name": "Robert Cooper",
            "role": "parent",
            "password": hashed_password,
            "phone": "+1234567899",
            "child_email": "alice@smartface.pro",
            "child_name": "Alice Cooper",
            "created_at": datetime.utcnow()
        }
    ]
    await db.users.insert_many(users)

    # Seed User Sessions (Devices)
    print("Seeding active user device sessions...")
    user_sessions = [
        {
            "session_id": "seed-session-student",
            "device_id": "seed-device-student",
            "user_email": "alice@smartface.pro",
            "user_agent": "Android Device",
            "ip_address": "192.168.1.15",
            "last_active": datetime.utcnow(),
            "created_at": datetime.utcnow() - timedelta(days=2),
            "expires_at": datetime.utcnow() + timedelta(days=1),
            "is_active": True
        },
        {
            "session_id": "seed-session-teacher",
            "device_id": "seed-device-teacher",
            "user_email": "teacher@smartface.pro",
            "user_agent": "Macbook",
            "ip_address": "192.168.1.22",
            "last_active": datetime.utcnow(),
            "created_at": datetime.utcnow() - timedelta(days=5),
            "expires_at": datetime.utcnow() + timedelta(days=1),
            "is_active": True
        },
        {
            "session_id": "seed-session-admin",
            "device_id": "seed-device-admin",
            "user_email": "admin@smartface.pro",
            "user_agent": "Windows PC",
            "ip_address": "192.168.1.100",
            "last_active": datetime.utcnow(),
            "created_at": datetime.utcnow() - timedelta(days=10),
            "expires_at": datetime.utcnow() + timedelta(days=1),
            "is_active": True
        },
        {
            "session_id": "seed-session-parent",
            "device_id": "seed-device-parent",
            "user_email": "parent@smartface.pro",
            "user_agent": "iPhone",
            "ip_address": "192.168.1.45",
            "last_active": datetime.utcnow(),
            "created_at": datetime.utcnow() - timedelta(days=1),
            "expires_at": datetime.utcnow() + timedelta(days=1),
            "is_active": True
        }
    ]
    await db.login_sessions.insert_many(user_sessions)

    # Seed Login History
    print("Seeding login history logs...")
    login_history = [
        {
            "email": "alice@smartface.pro",
            "device_name": "Android Device",
            "ip_address": "192.168.1.15",
            "status": "Success",
            "timestamp": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "email": "teacher@smartface.pro",
            "device_name": "Macbook",
            "ip_address": "192.168.1.22",
            "status": "Success",
            "timestamp": datetime.utcnow() - timedelta(hours=4)
        },
        {
            "email": "admin@smartface.pro",
            "device_name": "Windows PC",
            "ip_address": "192.168.1.100",
            "status": "Success",
            "timestamp": datetime.utcnow() - timedelta(hours=1)
        },
        {
            "email": "parent@smartface.pro",
            "device_name": "iPhone",
            "ip_address": "192.168.1.45",
            "status": "Success",
            "timestamp": datetime.utcnow() - timedelta(hours=5)
        }
    ]
    await db.login_logs.insert_many(login_history)

    
    # 3. Seed Sessions (1 active, 4 past)
    print("Seeding attendance sessions...")
    now = datetime.utcnow()
    
    # Past Sessions
    past_sessions = [
        {
            "teacher_id": "teacher@smartface.pro",
            "subject": "Mathematics",
            "start_time": now - timedelta(days=3, hours=4),
            "end_time": now - timedelta(days=3, hours=3),
            "is_active": False,
            "qr_code": "static_math_1"
        },
        {
            "teacher_id": "teacher@smartface.pro",
            "subject": "Physics",
            "start_time": now - timedelta(days=2, hours=4),
            "end_time": now - timedelta(days=2, hours=3),
            "is_active": False,
            "qr_code": "static_physics_1"
        },
        {
            "teacher_id": "teacher@smartface.pro",
            "subject": "Computer Science",
            "start_time": now - timedelta(days=1, hours=4),
            "end_time": now - timedelta(days=1, hours=3),
            "is_active": False,
            "qr_code": "static_cs_1"
        },
        {
            "teacher_id": "teacher@smartface.pro",
            "subject": "Deep Learning",
            "start_time": now - timedelta(hours=5),
            "end_time": now - timedelta(hours=4),
            "is_active": False,
            "qr_code": "static_dl_1"
        }
    ]
    past_results = await db.sessions.insert_many(past_sessions)
    past_session_ids = [str(uid) for uid in past_results.inserted_ids]
    
    # Active Session (with dynamic rotating token timestamp)
    active_now_ms = int(time.time() * 1000)
    active_session = {
        "teacher_id": "teacher@smartface.pro",
        "subject": "Deep Learning",
        "start_time": now,
        "is_active": True,
        "qr_code": f"token_{active_now_ms}_1"
    }
    active_result = await db.sessions.insert_one(active_session)
    active_session_id = str(active_result.inserted_id)
    
    # 4. Seed Attendance records
    print("Seeding attendance records...")
    # Seed attendance for past sessions
    attendance_records = []
    
    # Math session
    attendance_records.extend([
        {"student_email": "alice@smartface.pro", "session_id": past_session_ids[0], "timestamp": now - timedelta(days=3, hours=3, minutes=50), "status": "Present", "verified_by": "face"},
        {"student_email": "bob@smartface.pro", "session_id": past_session_ids[0], "timestamp": now - timedelta(days=3, hours=3, minutes=45), "status": "Present", "verified_by": "qr"},
        {"student_email": "charlie@smartface.pro", "session_id": past_session_ids[0], "timestamp": now - timedelta(days=3, hours=3, minutes=40), "status": "Present", "verified_by": "face"},
        {"student_email": "eve@smartface.pro", "session_id": past_session_ids[0], "timestamp": now - timedelta(days=3, hours=3, minutes=48), "status": "Present", "verified_by": "qr"},
    ])
    
    # Physics session
    attendance_records.extend([
        {"student_email": "alice@smartface.pro", "session_id": past_session_ids[1], "timestamp": now - timedelta(days=2, hours=3, minutes=52), "status": "Present", "verified_by": "face"},
        {"student_email": "bob@smartface.pro", "session_id": past_session_ids[1], "timestamp": now - timedelta(days=2, hours=3, minutes=47), "status": "Present", "verified_by": "qr"},
        {"student_email": "david@smartface.pro", "session_id": past_session_ids[1], "timestamp": now - timedelta(days=2, hours=3, minutes=43), "status": "Present", "verified_by": "face"},
    ])
    
    # CS session
    attendance_records.extend([
        {"student_email": "alice@smartface.pro", "session_id": past_session_ids[2], "timestamp": now - timedelta(days=1, hours=3, minutes=51), "status": "Present", "verified_by": "face"},
        {"student_email": "bob@smartface.pro", "session_id": past_session_ids[2], "timestamp": now - timedelta(days=1, hours=3, minutes=46), "status": "Present", "verified_by": "qr"},
        {"student_email": "charlie@smartface.pro", "session_id": past_session_ids[2], "timestamp": now - timedelta(days=1, hours=3, minutes=41), "status": "Present", "verified_by": "manual"},
        {"student_email": "eve@smartface.pro", "session_id": past_session_ids[2], "timestamp": now - timedelta(days=1, hours=3, minutes=49), "status": "Present", "verified_by": "qr"},
    ])
    
    # Past Deep Learning session
    attendance_records.extend([
        {"student_email": "alice@smartface.pro", "session_id": past_session_ids[3], "timestamp": now - timedelta(hours=4, minutes=50), "status": "Present", "verified_by": "face"},
        {"student_email": "bob@smartface.pro", "session_id": past_session_ids[3], "timestamp": now - timedelta(hours=4, minutes=45), "status": "Present", "verified_by": "qr"},
    ])
    
    await db.attendance.insert_many(attendance_records)
    
    # 5. Seed Leave Applications
    print("Seeding leave applications...")
    leaves = [
        # Alice (Rejected)
        {
            "user_id": "alice@smartface.pro",
            "reason": "Family vacation",
            "start_date": now - timedelta(days=5),
            "end_date": now - timedelta(days=3),
            "status": "Rejected",
            "remarks": "Vacations during midterms are not permitted.",
            "created_at": now - timedelta(days=10)
        },
        # Bob (Approved)
        {
            "user_id": "bob@smartface.pro",
            "reason": "Medical checkup",
            "start_date": now - timedelta(days=2),
            "end_date": now - timedelta(days=2),
            "status": "Approved",
            "remarks": "Get well soon. Medical certificate accepted.",
            "created_at": now - timedelta(days=4)
        },
        # Charlie (Pending)
        {
            "user_id": "charlie@smartface.pro",
            "reason": "Hackathon participation",
            "start_date": now + timedelta(days=1),
            "end_date": now + timedelta(days=3),
            "status": "Pending",
            "created_at": now - timedelta(days=1)
        },
        # David (Pending)
        {
            "user_id": "david@smartface.pro",
            "reason": "Dental appointment",
            "start_date": now + timedelta(days=2),
            "end_date": now + timedelta(days=2),
            "status": "Pending",
            "created_at": now
        }
    ]
    await db.leaves.insert_many(leaves)
    
    # 6. Seed Notifications
    print("Seeding notifications...")
    notifications = [
        {
            "user_id": "admin@smartface.pro",
            "title": "SYSTEM ALERT",
            "message": "Daily backup executed successfully.",
            "type": "announcement",
            "is_read": True,
            "created_at": now - timedelta(hours=12)
        },
        {
            "user_id": "teacher@smartface.pro",
            "title": "Leave Requested",
            "message": "Charlie Parker requested leave for Hackathon participation.",
            "type": "leave",
            "is_read": False,
            "created_at": now - timedelta(hours=2)
        },
        {
            "user_id": "alice@smartface.pro",
            "title": "Leave Application Update",
            "message": "Your leave request has been Rejected. Remarks: Vacations during midterms are not permitted.",
            "type": "leave",
            "is_read": False,
            "created_at": now - timedelta(days=3)
        },
        {
            "user_id": "bob@smartface.pro",
            "title": "Leave Application Update",
            "message": "Your leave request has been Approved.",
            "type": "leave",
            "is_read": True,
            "created_at": now - timedelta(days=1)
        }
    ]
    await db.notifications.insert_many(notifications)
    
    # 7. Seed Security logs
    print("Seeding security logs...")
    security_logs = [
        {
            "location": "Main Entrance Gate",
            "type": "intruder",
            "timestamp": now - timedelta(hours=10),
            "image_base64": None
        },
        {
            "location": "Server Room Corridor",
            "type": "intruder",
            "timestamp": now - timedelta(hours=2),
            "image_base64": None
        }
    ]
    await db.security_logs.insert_many(security_logs)
    
    print("\nSeeding completed successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
