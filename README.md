# <p align="center">🛡️ SmartFace Attendance & Biometric Security Suite</p>

<p align="center">
  <img src="smartface_banner.png" alt="SmartFace Attendance Banner" width="100%" />
</p>

<p align="center">
  <strong>Next-Gen AI Face Recognition Attendance & Enterprise Biometric Security Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/Sachinxcode-01/SmartAttendance-by-Using-FaceRecogniition-AI-"><img src="https://img.shields.io/badge/Python-3.9+-blue.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-v2.0-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://flutter.dev/"><img src="https://img.shields.io/badge/Flutter-v3.0+-02569B.svg?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter" /></a>
  <a href="https://streamlit.io/"><img src="https://img.shields.io/badge/Streamlit-v1.40+-FF4B4B.svg?style=for-the-badge&logo=streamlit&logoColor=white" alt="Streamlit" /></a>
  <a href="https://mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-v6.0+-47A248.svg?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <img src="https://img.shields.io/badge/ONNX_Runtime-ArcFace-lightgrey.svg?style=for-the-badge&logo=onnx&logoColor=white" alt="ONNX Runtime ArcFace" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License MIT" />
</p>

---

## 🌟 Overview

**SmartFace Attendance & Biometric Security Suite** is an enterprise-grade, multi-platform biometric ecosystem designed to completely automate attendance logging and enforce robust real-time security. 

Transitioned from a single local computer Python script, the system is now a **fully distributed platform** featuring high-performance AI face recognition, a secure FastAPI REST API backend, live WebSocket streams, an anti-proxy rotating QR verification system, an interactive cross-platform Flutter student application, elegant web dashboards, and LLM-powered natural language insights. It provides organizations with an elite, secure, and touchless administrative workflow.

---

## 🚀 Key Modules & System Features

### 🧠 1. Core Deep Learning Engine (`core/`)
* **High-Accuracy Biometrics:** Employs the **ArcFace (`buffalo_l`)** deep learning model via ONNX runtime for robust, ultra-fast 512-dimensional facial embedding extraction and high-accuracy verification.
* **Smart Face Training:** Dynamically parses the raw dataset structures, extracts embeddings, and compiles them into a serialized AI binary memory file (`data/face_encodings_arcface.pkl`) without manual data registration.
* **Active Intruder Engine:** Monitors live video streams. When an unregistered face is caught hovering in the frame, it captures a snapshot, logs a record in MongoDB, triggers WebSocket notifications, and delivers an instant critical SMTP Security Alert to administrators.
* **Voice Feedback Engine:** Greets students upon successful recognition in real time using automated TTS audio cues (`pyttsx3`).
* **AI Student Analyst:** Equipped with built-in LLM modules (`ai_analyst.py` & `ai_analyst_groq.py`) connected to the Groq/Gemini APIs to generate natural-language summaries of student performance trends.

### ⚡ 2. Backend Microservices (`backend/api/` & `backend/ai/`)
* **Node.js Express API Gateway (`backend/api/` - Port 8000):** Enterprise REST API & WebSocket gateway providing JWT identity flows, OTP verification, attendance analytics, timetable, and leave management.
* **FastAPI ArcFace AI Microservice (`backend/ai/` - Port 8001):** High-speed facial inference endpoint running ONNX ArcFace models for verified face-match validation.
* **Secure Authentication:** Complete JSON Web Token (JWT) identity flows paired with Google OAuth2 integrations.
* **Transaction-Safe Logins:** Multi-step transactional email OTP logins to prevent password leaks.
* **WebSocket Broadcaster:** Built-in bi-directional connection manager delivering real-time logs, session initiations, and intruder alerts directly to administrative dashboards.
* **Dynamic Anti-Proxy QR:** Prevents location/photo hacking by rotating dynamic server tokens at lightning speed, allowing a customizable 30-second clock-drift window for client verification.
* **Leave Management Portal:** Standardized endpoint pipelines to let students submit leave applications, while giving administrators approval/rejection endpoints that trigger automatic status emails.
* **Live GSheets Replication:** Automatic background synchronization (`gsheets_manager.py`) mapping every attendance record straight to external Google Sheets.
* **Production-Ready Security:** Token-bucket rate limiters on critical registration and login endpoints, custom RequestID tracing middleware, JSON structured logger, and secure CORS/HTTP headers.

### 📱 3. Cross-Platform Student App (`mobile/`)
* **Modern Flutter UI:** Exquisite, dark-mode native experience for Android and iOS devices.
* **Biometric Enrollment:** Connects with device camera and fingerprint scanners to verify student identity before logging attendance.
* **Dynamic QR Scanner:** Real-time scanner with decoding logic matching rotating server tokens to confirm classroom presence.
* **Attendance Insights & Chat:** Displays an elegant visual breakdown of personal attendance percentages, paired with an integrated AI Chatbot that replies to questions regarding personal performance logs.
* **Leave & Alerts:** Submit leave requests directly from the app and receive instant push updates when approved or rejected by the dean.

### 📊 4. Multi-Platform Web Portals & Dashboards (`frontend/web/`, `frontend/admin/` & `frontend/reflex/`)
* **Next.js 15 Modern Web Suite (`frontend/web/` - Port 3000):** Dedicated high-performance web portals:
  * `/student`: Live webcam check-in, anti-proxy QR scanner, attendance analytics, bunk calculator, dynamic ID card, and Gemini Copilot.
  * `/teacher`: Classroom session controller, full-screen rotating QR projector, biometric podium kiosk, and student roster.
  * `/admin`: System telemetry, intruder surveillance feed, student/faculty directory CRUD, ArcFace calibration, and audit trail.
* **Streamlit Admin Panel (`frontend/admin/web_dashboard.py` - Port 8501):** Start active class sessions, preview camera feeds, manage student databases, inspect database tables, and view security intruder logs in real time.
* **Reflex Web Dashboard (`frontend/reflex/`):** Full-stack responsive web client compiled directly into React and Next.js entirely from Python.
* **Dean Analytics & PDF Reports (`frontend/admin/`):** Stands up an FPDF-powered analytical reporting engine (`student_report.py` & `dean_report.py`). Automatically formats and prints exquisite **Deep Navy & Gold Classy PDF Reports** and delivers them to student inboxes securely via SMTP.

---

## 📂 Comprehensive Professional Project Directory Map

```text
SmartFace-attendance/
│
├── Makefile                        # 🌟 "ONE THING FOR ALL" - Master developer command runner
├── package.json                    # 🌟 Root npm scripts for cross-platform execution
├── ROUTES.md                       # 🚀 Instant 1-page API route & path reference cheat sheet
│
├── backend/                        # ⚡ SERVER-SIDE MICROSERVICES
│   ├── api/                        # Primary Node.js / Express REST & WebSocket API Gateway (Port 8000)
│   │   ├── src/                    # Controllers, middleware, routes, services
│   │   ├── tests/                  # Automated unit and integration test suite
│   │   └── package.json            # Node.js gateway package manifest
│   └── ai/                         # Python FastAPI ArcFace AI microservice (Port 8001)
│       ├── app/                    # FastAPI routes, ONNX inference adapters, auth
│       ├── tests/                  # Pytest verification suites
│       └── requirements.txt        # FastAPI microservice python manifest
│
├── frontend/                       # 🌐 WEB CLIENT APPLICATIONS
│   ├── web/                        # Modern Next.js 15 Landing & Student/Teacher Portal (Port 3000)
│   │   ├── app/ & components/      # Responsive React 19 UI with Tailwind & Framer Motion
│   │   └── package.json            # Next.js web application manifest
│   ├── admin/                      # Streamlit Real-Time Biometric & Reporting Dashboard (Port 8501)
│   │   ├── web_dashboard.py        # Live attendance monitor, class scheduler, and intruder stream
│   │   └── student_report.py       # PDF generator and email dispatch utility
│   └── reflex/                     # Python Reflex full-stack web client
│
├── mobile/                         # 📱 CROSS-PLATFORM STUDENT FLUTTER APP
│   ├── lib/                        # Flutter source code (Clean Architecture: core, data, presentation)
│   ├── assets/                     # Custom graphics, audio cues, and fonts
│   └── pubspec.yaml                # Flutter project package configurations
│
├── core/                           # 🧠 BIOMETRICS & AI ENGINE
│   ├── attendance_system.py        # Real-time ArcFace camera pipeline & security loops
│   ├── train_faces.py              # ML Embeddings Trainer: Compiles facial arrays into .pkl
│   ├── ai_analyst.py               # AI Analyst using Google Generative AI APIs
│   └── ai_analyst_groq.py          # AI Analyst leveraging Groq API for rapid inference
│
├── data/                           # 🗄️ PERSISTENT STORAGE
│   ├── dataset/                    # Training images organized as 'Name_RollNo' folders
│   ├── Intruders/                  # Security snapshot captures of unregistered visitors
│   ├── Reports/                    # PDF report exports
│   ├── Attendance_Logs/            # Local daily CSV records
│   ├── students.csv                # Student base flat-file index
│   └── face_encodings_arcface.pkl  # Compiled 512-dimensional facial AI vector embeddings
│
├── scripts/                        # 🛠️ DEVOPS & RUNTIME AUTOMATION
│   ├── run.ps1                     # Unified multi-platform developer CLI runner
│   ├── start_exam_demo.ps1         # Multi-service launcher
│   ├── stop_exam_demo.ps1          # Graceful service shutdown
│   ├── exam_preflight.ps1          # Pre-exam health diagnostics & hash verification
│   └── db_backup.py                # Automated MongoDB snapshot utility
│
├── docs/                           # 📚 AUDIT, CERTIFICATION & ARCHITECTURE EVIDENCE
│
├── .env.example                    # Environment variable template with documentation
├── requirements.txt                # Unified core project python packages
└── README.md                       # Project documentation
```

---

## 🛠️ Technology Stack & Core Integrations

* **Programming Language:** Python 3.9+ 🐍, Dart 🎯 (Flutter)
* **API Framework:** FastAPI ⚡ (Backend REST APIs & WebSockets)
* **Frontend Technologies:** Reflex (React/Next.js) 🌐, Streamlit 📊, Flutter 📱
* **Database & Caching:** MongoDB 🗄️, Local Binary Serializations (`.pkl`, `.csv`)
* **AI & Machine Learning:** InsightFace (ArcFace model `buffalo_l`), ONNX Runtime 🧠, Groq API & Gemini 3.5 Flash 🤖
* **Reporting:** FPDF2 📊, SMTP (Secure TLS / Google App Passwords) 📧
* **Automation Hooks:** Google Sheets API 📈

---

## ⚙️ Installation & Quickstart

---

## ⚙️ Quickstart — "One Thing for All" Developer Commands

Launch the full suite, microservices, or client applications with single-line commands:

### 🌟 1. One-Command Full Stack (`make dev` or `npm run dev`)
Spins up the Node.js API Gateway (port 8000), Python FastAPI AI Microservice (port 8001), and Next.js Web Portal (port 3000):
```bash
# Using Makefile
make dev

# Or using npm
npm run dev

# Or using native PowerShell runner
.\scripts\run.ps1 dev
```

### ⚡ 2. Backend Microservices Only (`make backend` or `npm run backend`)
Spins up both Node.js API Gateway (8000) and Python ArcFace AI (8001) in background:
```bash
npm run backend
# Or: make backend
```
- Node.js API Gateway: `http://localhost:8000`
- Python AI Microservice: `http://localhost:8001`
- Health Probe: `http://localhost:8000/api/health`

### 🌐 3. Web Frontend (`make frontend` or `npm run frontend`)
Runs the modern Next.js 15 web client on port 3000:
```bash
npm run frontend
# Or: make frontend
```

### 📊 4. Streamlit Admin Dashboard (`make admin` or `npm run admin`)
Runs the real-time class monitoring & intruder inspection panel on port 8501:
```bash
npm run admin
# Or: make admin
```

### 📱 5. Mobile Flutter App (`make mobile` or `npm run mobile`)
Automatically configures ADB reverse port forwarding (8000 & 8001) and launches Flutter:
```bash
npm run mobile
# Or: make mobile
```

### 🛑 6. Graceful Shutdown (`make stop` or `npm run stop`)
Stops all background Node and Python processes running on ports 8000 and 8001:
```bash
npm run stop
# Or: make stop
```

### 📋 7. System Diagnostics & Preflight (`npm run preflight`)
Runs verification across MongoDB, environment files, ports, and models:
```bash
npm run preflight
# Or: make preflight
```

*For the complete list of all endpoints, parameters, and quick cURL examples, see [ROUTES.md](file:///c:/Users/kalin/OneDrive/Documents/Projects/SmartFace-attendance/ROUTES.md).*

---

### Step 3: Run the Admin Streamlit Dashboard
1. Install core dependencies from the root directory:
   ```bash
   cd ..
   pip install -r requirements.txt
   ```
2. Start the interactive admin dashboard:
   ```bash
   streamlit run smartface_admin/web_dashboard.py
   ```
   *Access the web dashboard in your browser at `http://localhost:8501`*

---

### Step 4: Run the Flutter Mobile Application
1. Ensure you have the Flutter SDK configured on your system.
2. Install package dependencies:
   ```bash
   cd smartface_mobile
   flutter pub get
   ```
3. Boot up the app on your local emulator or physical device:
   ```bash
   flutter run
   ```

---

### Step 5: Perform Face Vector Model Training
When you add new student folders containing face images inside the `data/dataset` folder (structured as `Name_RollNo`), trigger the ArcFace embedding generation:
```bash
python core/train_faces.py
```
*This extracts biometric maps from the images and saves them directly to `data/face_encodings_arcface.pkl` to be matched in real-time camera cycles.*

---

## 📈 Key Usage Code & API Examples

### 1. Registering Attendance via WebSocket API (FastAPI)
Using WebSocket links, devices can securely stream and receive real-time attendance events:
```python
import asyncio
import websockets
import json

async def listen_for_marks():
    url = "ws://localhost:8000/ws/live-logs"
    async with websockets.connect(url) as websocket:
        print("⚡ Connected to SmartFace WebSocket Stream")
        while True:
            msg = await websocket.recv()
            data = json.loads(msg)
            if data.get("type") == "attendance_update":
                print(f"✅ Marked: {data['student_email']} - {data['status']}")

asyncio.run(listen_for_marks())
```

### 2. Live Recognition & Security Frame Scan (ArcFace Core)
```python
# Start the core recognition engine from the workspace root
python core/attendance_system.py
```
*Runs the OpenCV camera thread. Recognized faces trigger automated audio greets. Unregistered guests lingering for more than 5 seconds trigger local saves under `data/Intruders/` and email a priority intruder alert to the supervisor.*

### 3. Generate Navy & Gold PDF reports via CLI Admin Portal
```python
# Trigger student monthly summaries and email them reports:
python smartface_admin/student_report.py
```
*Prompts the supervisor to search by student Roll Number. Compiles monthly parameters, outputs an elegant PDF into `data/Reports/`, and fires the email directly to the student.*

---

## 🤝 Contributing

We welcome contributions to the SmartFace suite! To submit changes:
1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request for review.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Sachinxcode-01">Sachinxcode-01</a> & Team.
</p>
