# System Architecture & Threat Model: SmartFace Attendance Platform

## 1. Product, Principals & Protected Resources
SmartFace is an enterprise-grade biometric attendance and classroom monitoring ecosystem combining real-time computer vision with administrative reporting.

- **Principals**:
  - `student`: Authenticated via JWT Bearer or OTP. Enrolls dynamic face vectors, scans dynamic QR codes for class attendance, views personal attendance statistics, submits medical/personal leaves.
  - `teacher`: Initiates and terminates live class sessions, generates dynamic rotating QR codes, reviews student attendance risk telemetry, approves/rejects leaves.
  - `admin` / `super_admin` / `hod` / `principal` / `management`: Full administrative supervision, audit log extraction, raw report exports, camera intrusion feeds, user role administration.
  - `hardware scanner` / `camera device`: Embedded scanner client authenticating via pre-shared header `FACE_SCANNER_TOKEN` to mark face attendance and register intruder alerts.
  - `internal ai service`: Autonomous Python FastAPI backend communicating over private loopback / virtual network authenticated by `X-Internal-Token`.
- **Protected Resources**:
  - Biometric 512-D neural facial embeddings in MongoDB (`BiometricProfile`).
  - Raw face images on disk (`data/avatars/`, `data/dataset/`).
  - Academic attendance records and immutable security audit logs (`Attendance`, `AttendanceAuditLog`, `SecurityLog`).
  - Rotating anti-proxy QR session nonces and teacher classroom controls (`Session`).

---

## 2. Technical Stack & Deployment Boundaries
- **API Gateway**: Node.js v20+, Express.js 4.x, Mongoose, WebSockets (`ws`), Zod, JSON Web Tokens. Exposes HTTP REST and WebSocket telemetry on port `8000`.
- **AI Microservice**: Python 3.10+, FastAPI, ONNX Runtime, InsightFace ArcFace (`buffalo_l`), OpenCV Headless. Exposes verification endpoints on port `8001`.
- **Administrative Portal**: Streamlit on port `8501`.
- **Web Frontend**: Next.js 15, React 19 on port `3000`.
- **Mobile Client**: Flutter / Dart for Android and iOS devices.
- **Persistence**: MongoDB database cluster (`MONGODB_URL`), Redis session cache (`REDIS_URL`).
- **Deployment Topology**: Railway containerized multi-service architecture (`railway.json`).

---

## 3. Entry Surfaces & Source-to-Sink Data Paths
1. **Public Authentication (`/auth`)**:
   - Source: `POST /auth/login-password`, `/auth/login-otp/send`, `/auth/login-otp/verify`, `/auth/google`.
   - Path: Request JSON -> Zod schema validation -> `AuthService.verifyPassword` (bcrypt) / OTP email dispatch via Resend/Brevo -> Mongo `UserSession` document creation -> Signed JWT returned to caller.
2. **Dynamic Anti-Proxy QR Attendance (`/attendance/mark`)**:
   - Source: `POST /attendance/mark` with body `{ session_id, qr_token, latitude, longitude }`.
   - Path: Auth middleware verifies caller JWT -> checks active class session -> verifies QR rotation timestamp -> marks student presence.
3. **Hardware Biometric Inference Pipeline (`/attendance/mark/face` & `/security/intruder-alert`)**:
   - Source: Multipart image upload / Base64 image payload from hardware cameras.
   - Path: Verified via `FACE_SCANNER_TOKEN` header -> Node forwards image buffer to Python `/v1/face/verify` with `X-Internal-Token` -> FastAPI runs ArcFace ONNX inference -> returns cosine similarity score -> marks record or creates `SecurityLog`.
4. **Administrative Real-Time Telemetry (`/ws/live-logs`)**:
   - Source: WebSocket upgrade request `GET /ws/live-logs?token=<JWT>`.
   - Path: `server.on('upgrade')` validates token signature, active DB session in `UserSession`, and checks role whitelist (`admin`, `hod`, `principal`) before establishing bidirectional stream.
5. **AI Insights & LLM Analysis (`/ai` & `/student/stats/:email`)**:
   - Source: Student attendance history aggregated from MongoDB.
   - Path: System prompt dynamically synthesized in `ai.js` -> dispatched to Groq Cloud API (`llama-3.3-70b-versatile`) -> formatted response rendered to user.

---

## 4. Trust Boundaries & Strongest Source Controls
- **Boundary 1: External Client to API Gateway**:
  - Control: Strict HTTP security headers (`nosniff`, `DENY`, `same-origin`), NoSQL query sanitizer, CORS origin whitelisting in production (`CORS_ORIGINS`), and JWT + `UserSession` database existence checks.
- **Boundary 2: Gateway to AI Microservice**:
  - Control: Pre-shared bearer token `X-Internal-Token` validated using constant-time comparison (`hmac.compare_digest`), bounded file upload sizes (5MB), and concurrency limiting via `asyncio.Semaphore`.
- **Boundary 3: Hardware Devices to Gateway**:
  - Control: Header inspection of `FACE_SCANNER_TOKEN` or staff-authenticated JWT.
- **Boundary 4: File Uploads to Filesystem**:
  - Control: Multer disk storage filtering on image MIME types and safe sanitized file path naming.

---

## 5. Prior Gaps & Coverage Baseline
- No prior audit ledger exists for this repository (`prior_status: "new"` across all 18 seeded coverage units).
- Offline test coverage is supported via Node.js test runners (`tests/run_all.js`) and isolated mock fixtures.

---

## 6. Selected Attack Class Companions
- **`WEB-PROTOCOL-AND-AUTH.md`**: Required for JWT session revocation checks, OTP expiration lifecycle, and role gating.
- **`CLIENT-SIDE.md`**: Required for WebSocket upgrade authorization and cross-origin controls.
- **`AI-AND-LLM.md`**: Required for Groq LLM prompt assembly and context isolation.
- **`RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`**: Required for ArcFace ONNX inference concurrency gating and upload limits.
- **`DATA-ISOLATION-AND-LIFECYCLE.md`**: Required for 512-D facial biometric template protection in MongoDB.
- **`DESKTOP-MOBILE-AND-LOCAL-IPC.md`**: Required for Flutter mobile client keystore and credential storage.
- **`CLOUD-AND-DEPLOYMENT.md`**: Required for Railway multi-service secret propagation and environment configuration.
