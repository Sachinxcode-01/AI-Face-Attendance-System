# SmartFace AI — API Reference Manual

The main backend API gateway runs on Node.js/Express.js (Port `8000`). All endpoints are relative to the root URL (e.g. `http://localhost:8000`). There is no prefix.

---

## Global API Rules

1. **Authentication**: Most protected endpoints require a Bearer token in the `Authorization` header:
   ```http
   Authorization: Bearer <your_jwt_access_token>
   ```
2. **Error Format**: All errors return a JSON payload with a `detail` field for client compatibility:
   ```json
   {
     "detail": "Error description here"
   }
   ```
3. **Response Content Type**: All standard responses are returned in `application/json` format unless specified (e.g. file downloads).

---

## 1. Authentication Services (`/auth`)

These routes handle sign-ups, credential logins, OTP, Google OAuth, and profile management.

| Method | Route | Access | Payload | Response |
|:---|:---|:---|:---|:---|
| **POST** | `/auth/register` | Public (Rate-Limited) | `{ email, full_name, role, password }` | `{ id, email, full_name, role }` |
| **POST** | `/auth/login-password` | Public | `{ email, password }` | `{ access_token, token_type, role, biometric_registered }` |
| **POST** | `/auth/login-otp/send` | Public (Rate-Limited) | `{ email }` | `{ message: "OTP sent successfully" }` |
| **POST** | `/auth/login-otp/verify` | Public (Rate-Limited) | `{ email, otp }` | `{ access_token, token_type, role, biometric_registered }` |
| **POST** | `/auth/google` | Public | `{ email, name, role, avatar_url }` | `{ access_token, token_type, role, biometric_registered }` |
| **POST** | `/auth/forgot-password` | Public | `{ email }` | `{ message: "OTP sent to email" }` |
| **POST** | `/auth/reset-password` | Public | `{ email, otp, new_password }` | `{ message: "Password updated successfully" }` |
| **GET** | `/auth/profile` | Bearer Token | None | `{ id, email, full_name, role, phone, ... }` |
| **POST** | `/auth/update-profile` | Bearer Token | Profile keys dictionary | `{ message: "Profile updated successfully" }` |
| **POST** | `/auth/register-biometric` | Bearer Token | None | `{ message: "Biometric registration successful" }` |

---

## 2. Sessions & Attendance Services (`/sessions` & `/attendance`)

These routes manage attendance session scheduling, live scanning, QR/TOTP check-ins, and analytics.

| Method | Route | Access | Payload | Description |
|:---|:---|:---|:---|:---|
| **POST** | `/sessions/start` | Teacher / Admin | `{ teacher_email, subject }` | Spawns a new active session and generates a session QR code. |
| **POST** | `/sessions/stop` | Teacher / Admin | `{ session_id }` | Deactivates a live attendance session. |
| **GET** | `/sessions/active` | Bearer Token | None | Returns the currently active session. |
| **POST** | `/attendance/mark` | Bearer Token | `{ student_email, session_id, qr_code }` | Validates QR code, duplicate check, and records attendance. |
| **POST** | `/attendance/mark/face` | Face Scanner Key | `{ student_email, confidence }` | API for scanner hardware devices to mark attendance. |
| **GET** | `/attendance/dashboard` | Bearer Token | None | Returns percentage, health status, and analytics for a student. |
| **GET** | `/attendance/heatmap` | Bearer Token | None | Daily count distribution for student attendance. |
| **GET** | `/attendance/command-center` | Teacher / Admin | None | Returns statistics, trends, and department logs. |
| **GET** | `/attendance/live-monitor` | Teacher / Admin | None | Live session telemetry for active monitoring. |
| **GET** | `/attendance/risk-analysis` | Teacher / Admin | `?type=below_75` | Retrieves student profiles with low attendance health. |
| **GET** | `/attendance/audit-logs` | Admin | None | Retrieves security and compliance ledger records. |

---

## 3. Leave Management Services (`/leave`)

These endpoints manage student leave request filing, review workflows, and history tracking.

| Method | Route | Access | Payload | Description |
|:---|:---|:---|:---|:---|
| **POST** | `/leave/apply` | Bearer Token | `{ user_id, reason, start_date, end_date }` | Applies for a leave request. |
| **GET** | `/leave/student/:email`| Self / Staff | None | Retrieves all leaves submitted by a specific student. |
| **GET** | `/leave/admin/pending`| Teacher / Admin | None | Returns list of pending leave requests. |
| **PATCH** | `/leave/action` | Teacher / Admin | `{ leave_id, status, remarks }` | Approves or rejects a pending leave request. |

---

## 4. Reports Engine (`/reports`)

Tabular reports export endpoint. Accepts formats: `json`, `csv`, or `excel`.

| Method | Route | Access | Query Parameters | Description |
|:---|:---|:---|:---|:---|
| **GET** | `/reports/student/:email` | Self / Staff | `?format=csv` | Attendance ledger report of a specific student. |
| **GET** | `/reports/class/:sessionId` | Teacher / Admin | `?format=excel` | Attendance roster report of a single session. |
| **GET** | `/reports/department/:dept` | Admin / Management| `?format=csv` | Department attendance average scorecard. |

---

## 5. System & Real-Time Telemetry

### Real-Time Connections (WebSockets)
- **Notifications Channel**:
  `ws://localhost:8000/ws/notifications?token=<JWT>`
  Used to receive real-time notifications about session starts, leave updates, and security alerts.
- **Live Logs Channel**:
  `ws://localhost:8000/ws/live-logs`
  Used by admin dash hubs to monitor attendance markers as they happen.
