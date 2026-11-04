# 🚀 SmartFace API Routes & System Path Quick Reference

An executive, developer-friendly cheat-sheet detailing every service port, path, and API route across the SmartFace Biometric Attendance & Security ecosystem.

---

## 🌐 System Port Map

| Component | Technology | Default Port | Base URL | Description |
|:---|:---|:---:|:---|:---|
| **API Gateway** | Node.js / Express | `8000` | `http://localhost:8000` | Primary REST API & WebSocket server |
| **AI Microservice** | Python / FastAPI | `8001` | `http://localhost:8001` | ArcFace ONNX neural face verification |
| **Web Portal Suite** | Next.js 15 / React | `3000` | `http://localhost:3000` | Landing, Student, Teacher & Admin Portals |
| ↳ **Student Website** | Next.js 15 / React | `3000` | `http://localhost:3000/student` | Dedicated Student Attendance & AI Portal |
| ↳ **Lecturer Website** | Next.js 15 / React | `3000` | `http://localhost:3000/teacher` | Dedicated Faculty & QR Projector Portal |
| ↳ **Admin Panel** | Next.js 15 / React | `3000` | `http://localhost:3000/admin` | Dedicated Security Sentinel & Management Panel |
| **Admin Streamlit** | Streamlit | `8501` | `http://localhost:8501` | Live telemetry, class feeds & reports |
| **Mobile App** | Flutter | Mobile / ADB | Reverse proxy `8000`/`8001` | Cross-platform Android & iOS student client |

---

## 🌐 Dedicated Web Applications (Port 3000)

### 🎓 1. Student Portal (`/student`)
* **Live Webcam Face Check-in:** In-browser facial capture with ArcFace embedding verification.
* **Dynamic Anti-Proxy QR Scanner:** Camera scanner / manual token validator for rotating classroom codes.
* **Attendance Analytics:** Subject-wise percentage rings, overall standing, and streak counter.
* **Smart Bunk Calculator:** Real-time safe absence simulator & required attendance planner.
* **Daily Academic Timetable:** Interactive schedule with classroom directions and active status.
* **Leave Application & Tracking:** Submit medical / institutional leave and track Dean approval status.
* **Digital Holographic Student ID:** Verified digital ID card with barcode, dynamic QR, and printable export.
* **Gemini 3.8 Flash Student Copilot:** AI academic advisor for attendance forecasting and leave letter drafting.

### 👨‍🏫 2. Lecturer / Teacher Portal (`/teacher`)
* **Classroom Session Controller:** Configure subject, section, room, and start/stop live sessions.
* **Full-Screen Rotating QR Projector:** 15-second epoch anti-proxy rotating QR code for classroom smartboards.
* **Podium Biometric Kiosk Terminal:** Walk-up webcam face scanner with automated TTS greetings.
* **Live Student Roster & Manual Override:** Real-time status toggles (Present, Late, Absent, Excused).
* **Leave Requests Approval Inbox:** 1-click Approve / Reject with instructor remarks.
* **At-Risk Attendance Radar (<75%):** Automated detection and 1-click warning email dispatcher.
* **Export & Cloud Sync:** 1-click CSV, Excel, Dean PDF export, and live Google Sheets sync.
* **Gemini 3.8 Flash Faculty Copilot:** Class attendance analytics, proxy detection, and quiz question generator.

### 🛡️ 3. Admin Sentinel & Security Panel (`/admin`)
* **Executive Telemetry:** Multi-department attendance rates, total enrolled students, and system health.
* **Unregistered Face Intruder Sentinel:** CCTV surveillance stream and snapshot threat gallery.
* **Master User Directory (CRUD):** Add, edit, search, and delete students and faculty with biometric status.
* **ArcFace Calibration Station:** 5-angle face enrollment station to train embeddings into `.pkl` file.
* **Immutable Security Audit Trail:** Chronological tamper-proof logs of all verifications and overrides.
* **Automated PDF Reports Dispatcher:** Batch generate official Deep Navy & Gold reports via secure SMTP.
* **Hardware & Anti-Proxy Settings:** Configure API URLs, scanner tokens, and drift windows (15s/30s/60s).
* **Gemini 3.8 Flash Institutional Sentinel:** Accreditation briefs (NAAC/NBA), compliance audits, and security reports.

---

## ⚡ 1. Primary Node.js API Gateway (Port 8000)

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `POST` | `/auth/register` | Public | Student/Teacher account self-registration |
| `POST` | `/auth/login-password` | Public | Email + password login (returns JWT token) |
| `POST` | `/auth/login-otp/send` | Public | Dispatches OTP to registered email address |
| `POST` | `/auth/login-otp/verify` | Public | Verifies OTP and generates session JWT |
| `POST` | `/auth/google` | Public | Google OAuth2 token exchange |
| `POST` | `/auth/forgot-password` | Public | Requests password reset OTP |
| `POST` | `/auth/reset-password` | Public | Submits new password with OTP confirmation |
| `GET` | `/auth/profile` | Bearer | Returns current authenticated user profile |
| `POST` | `/auth/update-profile` | Bearer | Updates phone number, avatar, metadata |
| `POST` | `/auth/register-biometric`| Bearer | Links biometric face embedding to account |

### 📅 Sessions & QR Verification (`/sessions`)
| Method | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `POST` | `/sessions/start` | Teacher/Admin | Starts active class session & generates rotating QR |
| `POST` | `/sessions/stop` | Teacher/Admin | Closes active class attendance session |
| `GET` | `/sessions/active` | Bearer | Gets current live class session details |
| `GET` | `/sessions/history` | Teacher/Admin | Lists past session logs and statistics |

### 📝 Attendance Logging (`/attendance`)
| Method | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `POST` | `/attendance/mark` | Bearer | Marks presence via dynamic anti-proxy QR code |
| `POST` | `/attendance/mark/face` | Scanner Key | Hardware device / camera direct attendance marker |
| `GET` | `/attendance/dashboard` | Bearer | Returns personal attendance stats and percentage |
| `GET` | `/attendance/heatmap` | Bearer | Student daily check-in intensity distribution |
| `GET` | `/attendance/command-center` | Teacher/Admin | Live analytics and department attendance rates |
| `GET` | `/attendance/live-monitor` | Teacher/Admin | Real-time session telemetry stream |
| `GET` | `/attendance/risk-analysis` | Teacher/Admin | Detects students below attendance threshold (<75%) |
| `GET` | `/attendance/audit-logs` | Admin | Immutable biometric security audit trail |

### 🌴 Leave Management (`/leave`)
| Method | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `POST` | `/leave/apply` | Bearer | Submits medical or personal leave request |
| `GET` | `/leave/student/:email` | Self/Staff | Retrieves leave history for a specific student |
| `GET` | `/leave/admin/pending` | Teacher/Admin | Lists pending leave requests awaiting approval |
| `PATCH`| `/leave/action` | Teacher/Admin | Approves or rejects a student leave request |

### 📊 Reports Engine (`/reports`)
| Method | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `GET` | `/reports/export` | Teacher/Admin | Exports records in `json`, `csv`, or `excel` format |

### 🧠 LLM AI Insights (`/ai`)
| Method | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `POST` | `/ai/chat` | Bearer | Natural language student performance queries |
| `GET` | `/ai/insights/:roll` | Bearer | Generates student attendance summary via Groq / Gemini |

### 🔌 Real-Time WebSockets
| Protocol | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `WS` | `/ws/notifications?token=<jwt>` | Bearer | Live intruder alerts, session changes, and notifications |

---

## 🧠 2. Python FastAPI ArcFace Microservice (Port 8001)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/health` | Public | Lightweight liveness probe |
| `GET` | `/ready` | Public | Readiness probe (verifies ArcFace model and encodings are in memory) |
| `GET` | `/internal/health` | `X-Internal-Token` | Diagnostic telemetry (memory, CPU, model status) |
| `POST` | `/v1/face/verify` | `X-Internal-Token` | ArcFace 512-dim face recognition & match against encodings |
| `POST` | `/v1/face/train` | `X-Internal-Token` | Dynamic face embedding trainer (compiles encodings into `.pkl`) |

---

## ⚡ Fast cURL Developer Testing

```bash
# 1. Test Node.js Gateway Health
curl http://127.0.0.1:8000/api/health

# 2. Test Python AI Engine Readiness
curl http://127.0.0.1:8001/ready

# 3. Test Student Login (Node.js)
curl -X POST http://127.0.0.1:8000/auth/login-password \
  -H "Content-Type: application/json" \
  -d '{"email": "student@smartface.ai", "password": "Password123!"}'

# 4. Test Python Face Verification
curl -X POST http://127.0.0.1:8001/v1/face/verify \
  -H "X-Internal-Token: internal_secret_token_123" \
  -F "image=@data/dataset/Sample_01/1.jpg"
```

---

## 📂 New Professional Directory Layout

```text
SmartFace-attendance/
├── Makefile                # Master command runner
├── package.json            # Root developer scripts
├── ROUTES.md               # This API route & path reference
│
├── backend/
│   ├── api/                # Node.js Express Gateway (Port 8000)
│   └── ai/                 # Python FastAPI ArcFace Microservice (Port 8001)
│
├── frontend/
│   ├── web/                # Next.js 15 Web Portal (Port 3000)
│   ├── admin/              # Streamlit Live Monitoring Dashboard (Port 8501)
│   └── reflex/             # Reflex Python Fullstack Web App
│
├── mobile/                 # Cross-platform Flutter App (Android & iOS)
├── core/                   # Core ArcFace biometrics & recognition engine
├── data/                   # Datasets, ArcFace encodings (.pkl), CSV logs
├── scripts/                # run.ps1, preflight, backups, and launch scripts
└── docs/                   # Architecture and security documentation
```
