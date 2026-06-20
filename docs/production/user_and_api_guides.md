# SmartFace AI Operational Guides & API Documentation

This dossier contains the deployment tutorials, operational guides, user manuals, and API endpoints documentation for the **SmartFace AI Biometric Attendance System**.

---

## 🛠️ Deployment Guide (Docker & Production Setup)

Follow these instructions to spin up the entire backend stack (Node.js API, Python AI Services, and MongoDB/Redis cache) in a production environment using Docker Compose.

### 1. File Structure Setup
Create a directory named `/opt/smartface-prod/` and place the following files:

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: smartface-mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - smartface-net

  redis:
    image: redis:7.2-alpine
    container_name: smartface-redis
    restart: always
    ports:
      - "6379:6379"
    networks:
      - smartface-net

  node-api:
    image: ghcr.io/yourusername/smartface-node-api:latest
    container_name: smartface-node-api
    restart: always
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - APP_ENV=production
      - MONGODB_URL=mongodb://mongodb:27017/smartface
      - REDIS_URL=redis://redis:6379
      - FACE_SCANNER_TOKEN=${FACE_SCANNER_TOKEN}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - mongodb
      - redis
    networks:
      - smartface-net

  python-ai:
    image: ghcr.io/yourusername/smartface-python-ai:latest
    container_name: smartface-python-ai
    restart: always
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - MONGODB_URL=mongodb://mongodb:27017/smartface
      - FACE_SCANNER_TOKEN=${FACE_SCANNER_TOKEN}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - mongodb
    networks:
      - smartface-net

networks:
  smartface-net:
    driver: bridge

volumes:
  mongo-data:
```

### 2. Environment Configuration (`.env`)
Create a `.env` file containing institutional credentials:
```env
FACE_SCANNER_TOKEN=c3BvcnQtZmFjZS1zY2FubmVyLXNlY3VyZS1wYXNzLXdvcmQ=
SECRET_KEY=9a2b8e3d6c7f1a4e5b6d9c8e7f0a1b2c3d4e5f6g7h8i9j0
```

### 3. Startup Command
```bash
docker-compose up -d
```
Verify that all containers are running and healthy:
```bash
docker ps
curl http://localhost:8000/health
```

---

## 🔑 Admin Guide (Institutional Operations)

System administrators manage data integration, audit logs, and security monitoring.

### 1. Creating Users & Managing Roles
*   Admin users can create staff profiles (Principal, HOD, Teacher) by posting to `/auth/register` and specifying the target role.
*   Standard roles include:
    *   `admin`: Full platform access, security logs review, database maintenance.
    *   `teacher`: Create sessions, mark attendance, track statistics.
    *   `student`: View personal analytics, apply for leaves, receive push notifications.

### 2. Monitoring Intruder Alerts & Security Telemetry
*   If the face scanner hardware detects an unregistered user attempting to gain access, a warning is sent to `/security/intruder-alert`.
*   Admins view these alerts inside the telemetry dashboard. Critical alerts trigger email notifications via the configured `nodemailer` SMTP gateway.
*   Admins must audit the security logs regularly to identify rate-limiter triggers or unauthorized endpoints access.

---

## 🧑‍🏫 Teacher Guide (Classroom Management)

Teachers control attendance windows and evaluate biometric match rates.

### 1. Initiating Attendance Sessions
1. Log in to the SmartFace AI App.
2. Select your target Class, Subject, and Room.
3. Tap **Start Session**. This creates a live session token valid for 10 minutes.
4. The classroom camera/hardware scanner is activated, and students can begin marking attendance.

### 2. Reviewing Dashboard Analytics & Heatmaps
*   **Live logs grid**: View real-time names popping up as the AI matching verifies student identities.
*   **Heatmaps & Streaks**: Review monthly attendance rates per class to highlight low-turnout days.
*   **Leave Approvals**: View student leaves requests, examine medical certificate attachments, and tap **Approve** or **Reject**.

---

## 🧑‍🎓 Student Guide (Attendance Portal)

Students track attendance history, manage leaves, and verify profile details.

### 1. Profile Face Registration
1. On initial login, go to **Profile Settings** and select **Biometric Registration**.
2. Capture 3 neutral-expression photos of your face.
3. The app uploads these to `/ai/register`, where the ArcFace service extracts the face template vectors and securely stores them in your database profile.

### 2. Viewing Attendance Analytics
*   **Smart Attendance Score (0-100)**: Displays overall attendance health.
    *   `>= 75`: **Excellent** (Green)
    *   `70 - 74`: **Warning** (Yellow)
    *   `< 70`: **Critical** (Red - Alert for potential exam debarment)
*   **Streaks**: Attendance streaks are computed dynamically. Maintain a 5-day streak to claim campus productivity badges.

---

## 📡 API Reference Documentation

### Authentication Endpoints

| Endpoint | Method | Headers | Body Format | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | None | `{ name, email, password, role }` | `201 Created` | Registers a new user. |
| `/auth/login-password` | `POST` | None | `{ email, password }` | `{ token, role }` | Authenticates and returns JWT. |

### Attendance & Session Endpoints

| Endpoint | Method | Headers | Body Format | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/sessions/start` | `POST` | `Authorization: Bearer <JWT>` | `{ class_id, subject, teacher_email }` | `{ session_id }` | Spins up active session. |
| `/attendance/mark/face` | `POST` | `X-Face-Scanner-Token` | `{ session_id, image_base64 }` | `200 OK` | Processes biometric check-in. |
| `/security/intruder-alert` | `POST` | `X-Face-Scanner-Token` | `{ ip_address, snap_base64 }` | `201 Created` | Logs security breach. |

### Student Portals Endpoints

| Endpoint | Method | Headers | Params | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/leave/apply` | `POST` | `Authorization: Bearer <JWT>` | `{ user_id, reason, date }` | `201 Created` | Applies for student leave. |
| `/notifications/:email` | `GET` | `Authorization: Bearer <JWT>` | `email` | `[notifications]` | Lists user's notifications. |
| `/student/stats/:email` | `GET` | `Authorization: Bearer <JWT>` | `email` | `{ stats }` | Gets attendance score details. |
