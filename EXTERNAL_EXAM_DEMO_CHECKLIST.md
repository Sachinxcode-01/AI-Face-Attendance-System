# 📋 Smart Attendance AI — External Examination Demonstration Guide

This checklist details the recommended step-by-step demonstration sequence for tomorrow's external examination, covering all core role workflows, real-time face and QR attendance, analytics, and fallback options.

---

## 🚀 Demonstration Flow & Step-by-Step Script

### 1. App Launch & Branding
- [ ] Launch **Smart Attendance AI** from the Android home screen.
- [ ] Demonstrate native splash, animated entrance sequence, and brand logo.
- [ ] Highlight reduced motion accessibility support.

### 2. Student Role Workflow
- [ ] Sign in using Student credentials (`kalinganavarsachin@gmail.com` / OTP).
- [ ] **Student Dashboard**:
  - Show live attendance percentage summary ring (e.g. 83%).
  - Show daily schedule carousel and subject breakdowns.
  - Show quick action buttons.
- [ ] **Schedule / Timetable**:
  - Tap **Schedule** tab on the bottom bar.
  - Filter by days (Monday - Friday) to show timetable cards.
- [ ] **Attendance Hub & Reports**:
  - Open **Reports** tab.
  - Show subject-wise attendance metrics and attendance history log.

### 3. Teacher Attendance Session & QR Generation
- [ ] Open secondary device or log out and log in as **Teacher** (`teacher@smartface.ai` / password).
- [ ] Navigate to **Attendance Command Center**.
- [ ] Select class (e.g. CSE 6th Sem - Compiler Design) and tap **Start Session**.
- [ ] Show **Rolling QR Code Generation** with dynamic countdown timer.

### 4. Real-Time Student QR Marking
- [ ] On Student device, tap **Scan** tab on the bottom navigation bar.
- [ ] Point camera at Teacher's rolling QR code.
- [ ] Verify successful scan feedback and instant real-time WebSocket update on Teacher's **Live Monitor** screen.
- [ ] Scan again to demonstrate **Duplicate Attendance Prevention** guard.

### 5. AI Face Verification Flow
- [ ] On Student device, select **Face Attendance**.
- [ ] Capture enrolled student's face.
- [ ] Detail the 3-tier architecture:
  `Flutter App → Local Node.js API (8000) → Local Python AI (8001) [InsightFace]`
- [ ] Demonstrate successful face match, confidence score, and record persistence in MongoDB.
- [ ] Test with an unenrolled / unknown face to demonstrate secure rejection.

### 6. Parent Ward Overview
- [ ] Log in as **Parent** (`parent@smartface.ai` / password).
- [ ] Demonstrate linked ward selector displaying ward attendance metrics.
- [ ] Show RBAC isolation (Parent cannot view unassigned students).

### 7. Admin & HOD Command Center
- [ ] Log in as **Admin / HOD** (`admin@smartface.ai` / password).
- [ ] **Admin Dashboard**: View system health, security event feed, and attendance telemetry.
- [ ] **User Management**: Filter by roles (Student, Teacher, Parent, Admin), search user accounts.
- [ ] **System Monitoring**: View tamper-proof security log ledger.

### 8. Session Clean Logout
- [ ] Demonstrate secure session token clearance and redirect to Login screen.

---

## 🛡️ Backup Demonstration Plan (Network/Camera Fallback)

If physical camera lighting is poor or local Wi-Fi drops during examination:
1. **QR Scanner Fallback**: Use pre-generated static test QR code or manual teacher override input.
2. **Face Verification Fallback**: Use pre-loaded test image asset via local test suite runner `npm test`.
3. **Offline Sync Demonstration**: Turn off phone Wi-Fi, mark attendance locally, turn Wi-Fi back on to demonstrate automatic offline sync engine upload.
