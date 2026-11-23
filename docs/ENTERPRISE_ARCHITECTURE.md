# SmartFace Biometric Attendance Platform: Enterprise Architecture Specification

## 1. System Architecture Overview

The SmartFace Attendance platform has been elevated to a resilient, enterprise-grade multi-tier architecture designed for scalability, zero-trust security, real-time telemetry, and high concurrency.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION TIER                       │
│    • Next.js 15 Web Portal (Admin, Teacher, Student, Parent)           │
│    • Flutter 3+ Cross-Platform Mobile Application (Biometrics & Geo)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (HTTPS / WSS / TLS 1.3)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY & ROUTING                         │
│  • Express 4.19+ Gateway                                               │
│  • Security: Helmet headers, NoSQL Injection Sanitization, Rate Limits │
│  • Route Versioning: /api/v1/..., /api/v2/...                          │
│  • Socket.IO WebSocket Server (Session feeds, Live HUD, Notifications) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼───────────────────────────┐
       ▼                            ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│ CONTROLLERS   │           │ CENTRAL RBAC  │           │ MONITORING    │
│ • Attendance  │           │ • Roles       │           │ • Prometheus  │
│ • Auth        │           │ • Permissions │           │ • Health / L/R│
│ • Teacher     │           │ • Middleware  │           │ • Audit Logs  │
│ • Analytics   │           └───────┬───────┘           └───────────────┘
│ • Leave/Parent│                   │
└──────┬────────┘                   │
       ▼                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SERVICE & BUSINESS LAYER                      │
│  • AuthService (JWT, OTP, Session Tracking)                            │
│  • FaceAiService (mTLS token bridge to AI microservice)                │
│  • NotificationService & AuditService                                  │
│  • BullMQ Queues (Email, Attendance, Notifications)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│      REPOSITORIES LAYER       │        │     CORE ATTENDANCE ENGINE    │
│  • UserRepository             │        │     (Single Source of Truth)  │
│  • AttendanceRepository       │        │  • core/attendance_system.py  │
│  • SessionRepository          │        │  • core/train_faces.py        │
│  • LeaveRepository            │        │  • core/ai_analyst.py         │
│  • BiometricProfileRepository │        │  • InsightFace ArcFace (512D) │
└──────────────┬────────────────┘        └──────────────┬────────────────┘
               ▼                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│     MONGODB CLUSTER (ATLAS)   │        │     REDIS CACHE & BULLMQ      │
│  • Indexed Collections        │        │  • Sliding window limiters    │
│  • Compound unique constraints│        │  • Background job workers     │
└───────────────────────────────┘        └───────────────────────────────┘
```

---

## 2. Centralized Role-Based Access Control (RBAC) Matrix

| Permission | Student | Parent | Teacher | Admin | SuperAdmin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `attendance.read.own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `attendance.write.face` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `attendance.write.qr` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `attendance.manage` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `session.create` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `session.manage` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `leave.apply` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `leave.approve` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `analytics.view.own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `analytics.view.class`| ❌ | ❌ | ✅ | ✅ | ✅ |
| `analytics.view.system`| ❌ | ❌ | ❌ | ✅ | ✅ |
| `analytics.export` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `user.manage` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `ai.train` | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 3. High Availability, Backup Strategy & Disaster Recovery Plan

### Backup Strategy (RPO $\le$ 1 hour, RTO $\le$ 15 minutes)
1. **Continuous Cloud Backups**:
   - Automated point-in-time recovery (PITR) enabled on MongoDB Atlas cluster.
   - Daily automated snapshots scheduled at 02:00 UTC with a 30-day retention window.
2. **Biometric Vector Integrity & Storage**:
   - 512-D ArcFace vectors and dataset directories are mirrored to encrypted, versioned object storage (AWS S3 / GCS bucket).
   - In-memory pickle encodings (`data/face_encodings_arcface.pkl`) are pre-validated by checksum on worker boot.

### Disaster Recovery Steps
1. **Database Failover**:
   - Multi-region replica sets automatically elect a new primary node within 5 seconds of failure.
   - Node API gateway utilizes persistent reconnection pools with exponential backoff.
2. **AI Microservice Isolation**:
   - In the event of a GPU accelerator failure, the `LegacyAttendanceAdapter` automatically falls back to CPU inference without dropping incoming attendance check-in requests.
   - Rate limiting and request concurrency semaphores prevent CPU starvation under high load.

---

## 4. Production Metrics & Health Check Standards

- **`GET /health`**: Returns system uptime, process memory, and host details.
- **`GET /readiness`**: Kubernetes readiness probe verifying active MongoDB connection.
- **`GET /liveness`**: Kubernetes liveness probe verifying event loop responsiveness.
- **`GET /metrics`**: Prometheus-formatted metrics exporting HTTP request durations, error rates, and active queue counts.
- **`GET /api/v1/ai/status`**: Live status probe for the InsightFace ArcFace recognition engine.
