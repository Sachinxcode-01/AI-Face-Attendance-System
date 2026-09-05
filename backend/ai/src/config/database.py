import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.smartface

async def get_db():
    return db

# Collections
users_collection = db.users
attendance_collection = db.attendance
sessions_collection = db.sessions
notifications_collection = db.notifications
login_logs_collection = db.login_logs
audit_logs_collection = db.audit_logs
devices_collection = db.devices
login_sessions_collection = db.login_sessions

