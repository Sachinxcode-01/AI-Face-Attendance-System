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

### ⚡ 2. Enterprise FastAPI API Gateway (`smartface_pro_api/`)
* **Secure Authentication:** Complete JSON Web Token (JWT) identity flows paired with Google OAuth2 integrations.
* **Transaction-Safe Logins:** Multi-step transactional email OTP logins to prevent password leaks.
* **WebSocket Broadcaster:** Built-in bi-directional connection manager delivering real-time logs, session initiations, and intruder alerts directly to administrative dashboards.
* **Dynamic Anti-Proxy QR:** Prevents location/photo hacking by rotating dynamic server tokens at lightning speed, allowing a customizable 30-second clock-drift window for client verification.
* **Leave Management Portal:** Standardized endpoint pipelines to let students submit leave applications, while giving administrators approval/rejection endpoints that trigger automatic status emails.
* **Live GSheets Replication:** Automatic background synchronization (`gsheets_manager.py`) mapping every attendance record straight to external Google Sheets.
* **Production-Ready Security:** Token-bucket rate limiters on critical registration and login endpoints, custom RequestID tracing middleware, JSON structured logger, and secure CORS/HTTP headers.

### 📱 3. Cross-Platform Student App (`smartface_mobile/`)
* **Modern Flutter UI:** Exquisite, dark-mode native experience for Android and iOS devices.
* **Biometric Enrollment:** Connects with device camera and fingerprint scanners to verify student identity before logging attendance.
* **Dynamic QR Scanner:** Real-time scanner with decoding logic matching rotating server tokens to confirm classroom presence.
* **Attendance Insights & Chat:** Displays an elegant visual breakdown of personal attendance percentages, paired with an integrated AI Chatbot that replies to questions regarding personal performance logs.
* **Leave & Alerts:** Submit leave requests directly from the app and receive instant push updates when approved or rejected by the dean.

### 📊 4. Dual Web & Reporting Dashboard Platforms (`smartface_admin/` & `smartface_pro_web/`)
* **Streamlit Admin Panel (`web_dashboard.py`):** Start active class sessions, preview camera feeds, manage student databases, inspect database tables, configure rate-limiters, and read security intruder logs in real time.
* **Reflex Web Dashboard (`smartface_pro_web/`):** Full-stack responsive web client compiled directly into React and Next.js entirely from Python.
* **Dean Analytics & PDF Reports (`student_report.py` & `dean_report.py`):** Stands up an FPDF-powered analytical reporting engine. Automatically formats and prints exquisite **Deep Navy & Gold Classy PDF Reports** and delivers them to student inboxes securely via SMTP.

---

## 📂 Comprehensive Project Directory Map

```text
SmartFace-attendance/
│
├── core/                           # 🧠 CORE ML & RECOGNITION SYSTEM
│   ├── attendance_system.py        # Main real-time camera analyzer, ArcFace matching, and security loops
│   ├── train_faces.py              # ML Embeddings Trainer: Compiles facial arrays into pickles
│   ├── ai_analyst.py               # AI Analyst using Google Generative AI APIs
│   ├── ai_analyst_groq.py          # AI Analyst leveraging Groq API for rapid inference
│   └── Attendance_Logs/            # Flat-file raw log fallback directory
│
├── smartface_pro_api/              # ⚡ ENTERPRISE FASTAPI BACKEND GATEWAY
│   ├── main.py                     # Main API entrypoint: REST routes, WebSockets, rate limiters, security
│   ├── auth_service.py             # JWT token utilities, password hashing, and user validation
│   ├── database.py                 # Async MongoDB collection client configurations
│   ├── db_indexes.py               # MongoDB index manager for speed optimization
│   ├── email_service.py            # SMTP mail dispatcher (OTPs, leave reviews, security warnings)
│   ├── gsheets_manager.py          # Real-time background sync with Google Sheets
│   ├── middleware.py               # Security headers, RequestID injection, and JSON logging stack
│   ├── models.py                   # Pydantic core data schemas and validation templates
│   ├── seed_db.py                  # Database seeder utility for local mock records
│   └── requirements.txt            # FastAPI python dependency package manifest
│
├── smartface_admin/                # 📊 DUAL REPORTING & STREAMLIT DASHBOARD PANELS
│   ├── web_dashboard.py            # Elegant Streamlit dashboard for class scheduling & live monitoring
│   ├── student_report.py           # Premium PDF generator & SMTP dispatch CLI panel
│   ├── student_portal.py           # Standard classroom overview analytics portal
│   ├── dean_report.py              # Bulk analytical reporting dashboards
│   └── desktop_app.py              # Legacy Tkinter-based desktop admin panel
│
├── smartface_pro_web/              # 🌐 PYTHON REFLEX WEB FRONTEND (REACT / NEXT.JS)
│   ├── smartface_pro_web/          # reflex code packages
│   ├── assets/                     # Frontend media, logos, and style sheets
│   └── rxconfig.py                 # Reflex platform config settings
│
├── smartface_mobile/               # 📱 CROSS-PLATFORM STUDENT FLUTTER APPLICATION
│   ├── lib/                        # Flutter app source files (Screens, Services, Models)
│   ├── assets/                     # Custom app logos, sounds, and graphics
│   ├── pubspec.yaml                # Flutter project package configurations
│   └── ios/ & android/             # Native platform configuration directories
│
├── data/                           # 🗄️ LOCAL TRANSACTIONAL DATABASE
│   ├── dataset/                    # Training images organized as 'Name_RollNo' folders
│   ├── Intruders/                  # Security snaps of unknown individuals
│   ├── Reports/                    # Exquisite PDF reports exported locally
│   ├── Attendance_Logs/            # Local daily csv records
│   ├── students.csv                # Student base flat-file index
│   ├── face_encodings_arcface.pkl  # Compiled 512-dimensional facial AI vector embeddings
│   └── *.csv                       # Configuration files (teachers, database credentials)
│
├── .env                            # 🔐 Environment configurations (Sensitive API keys, passwords)
├── .gitignore                      # Prevents secrets, cache files, and big binaries from entering git
├── requirements.txt                # Unified core project python packages
└── README.md                       # High-fidelity project documentation
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

To run the full suite on your local development environment:

### Step 1: Clone the Repository & Configure Environment
```bash
git clone https://github.com/Sachinxcode-01/SmartAttendance-by-Using-FaceRecogniition-AI-.git
cd SmartAttendance-by-Using-FaceRecogniition-AI-
```

Create a `.env` file in the root directory (and inside `smartface_pro_api/`) using the following keys:
```env
# Database & Security
MONGO_URI=mongodb://localhost:27017/smartface
JWT_SECRET=your_super_secret_jwt_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FACE_SCANNER_TOKEN=secure_face_scanner_default_key_123

# Integrations
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
GSHEETS_URL=https://docs.google.com/spreadsheets/d/...

# SMTP Email Configurations
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=saxhin0708@gmail.com
EMAIL_PASSWORD=your_google_app_password
```

---

### Step 2: Spin Up the FastAPI Web Server
1. Navigate to the API folder and install dependencies:
   ```bash
   cd smartface_pro_api
   pip install -r requirements.txt
   ```
2. *(Optional)* Seed your MongoDB database with mock students and teachers:
   ```bash
   python seed_db.py
   ```
3. Start the hot-reloading development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The Swagger UI documentation is interactive at: `http://localhost:8000/api/docs`*

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
