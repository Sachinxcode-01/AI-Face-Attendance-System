"""
Database index bootstrap for SmartFace API.
Run once on startup via FastAPI lifespan event.
Creates indexes for optimal query performance across all collections.
"""
import logging
from pymongo import ASCENDING, DESCENDING, TEXT
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger("smartface.db")


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all MongoDB indexes for production performance."""
    try:
        # ── users ────────────────────────────────────────────────────
        await db.users.create_index([("email", ASCENDING)], unique=True, name="email_unique")
        await db.users.create_index([("role", ASCENDING)], name="role_idx")
        await db.users.create_index([("email", ASCENDING), ("role", ASCENDING)], name="email_role_idx")

        # ── attendance ───────────────────────────────────────────────
        await db.attendance.create_index(
            [("student_email", ASCENDING), ("timestamp", DESCENDING)],
            name="student_attendance_idx"
        )
        await db.attendance.create_index([("session_id", ASCENDING)], name="session_attendance_idx")
        await db.attendance.create_index([("timestamp", DESCENDING)], name="attendance_ts_idx")

        # ── sessions ─────────────────────────────────────────────────
        await db.sessions.create_index([("is_active", ASCENDING)], name="active_sessions_idx")
        await db.sessions.create_index([("teacher_id", ASCENDING)], name="teacher_sessions_idx")
        await db.sessions.create_index([("start_time", DESCENDING)], name="session_time_idx")

        # ── notifications ────────────────────────────────────────────
        await db.notifications.create_index(
            [("user_id", ASCENDING), ("is_read", ASCENDING), ("created_at", DESCENDING)],
            name="user_notifications_idx"
        )
        await db.notifications.create_index([("created_at", DESCENDING)], name="notif_time_idx")

        # ── login_otps — TTL index auto-deletes expired OTPs ─────────
        await db.login_otps.create_index(
            [("expiry", ASCENDING)],
            expireAfterSeconds=0,
            name="otp_ttl_idx"
        )
        await db.login_otps.create_index([("email", ASCENDING)], unique=True, name="otp_email_unique")

        # ── security_logs ────────────────────────────────────────────
        await db.security_logs.create_index([("timestamp", DESCENDING)], name="security_ts_idx")

        # ── leaves ───────────────────────────────────────────────────
        await db.leaves.create_index([("status", ASCENDING), ("user_id", ASCENDING)], name="leave_status_idx")
        await db.leaves.create_index([("user_id", ASCENDING)], name="leave_user_idx")

        # ── revoked_tokens — TTL index auto-deletes expired tokens ───
        await db.revoked_tokens.create_index(
            [("expires_at", ASCENDING)],
            expireAfterSeconds=0,
            name="token_ttl_idx"
        )
        await db.revoked_tokens.create_index([("token", ASCENDING)], unique=True, name="token_unique")

        logger.info("✅ All MongoDB indexes created/verified successfully")

    except Exception as e:
        logger.error(f"❌ Index creation error: {e}")
        # Non-fatal — app continues but logs the issue
