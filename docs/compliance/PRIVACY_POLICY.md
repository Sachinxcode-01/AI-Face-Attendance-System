# SmartFace Attendance — Institutional Privacy & Biometric Data Policy

> **Effective Date**: January 1, 2026 | **Version**: 2.0 (Enterprise Multi-Tenant Edition)  
> **Applicable Entities**: Rural Engineering College Hulkoti, IIT Dharwad Campus, and Partner Educational Institutions.

---

## 1. Scope & Core Privacy Commitment
SmartFace Attendance ("the Platform") provides automated facial-recognition and multi-factor attendance recording for educational institutions. We operate under the foundational principle of **Privacy by Design & Default**:
- **Zero Raw Image Retention**: Facial photographs captured during enrolment or at scanning kiosks are converted into irreversible mathematical embeddings (512-dimensional vector arrays) in volatile memory and immediately discarded.
- **No Third-Party Commercial Exploitation**: Student and staff biometric vectors are never sold, rented, monetized, or shared with commercial advertising or surveillance brokers.
- **Strict Multi-Tenant Sandboxing**: Biometric records, attendance logs, and student profiles are cryptographically segregated per institution (`college_id`).

---

## 2. Categories of Data Collected
1. **Identification & Profile Data**: Full name, student roll/USN number, institutional email address, department, semester, class section.
2. **Biometric Vector Templates**: Irreversible mathematical floating-point representations (ArcFace 512-d embeddings) generated using deep neural networks. Cannot be reverse-engineered into human-identifiable facial imagery.
3. **Attendance Telemetry**: Timestamp of check-in, classroom session identifier, verification modality (`face`, `dynamic_qr`, `offline_sync`), camera kiosk location, and ambient lighting quality score.
4. **Security & Access Logs**: Client IP address, user-agent, device security posture (root/jailbreak status), and failed authentication attempts.

---

## 3. Legal Grounds for Processing (GDPR & DPDP Act 2023)
- **GDPR Article 9(2)(a)**: Explicit written or electronic consent provided by the data subject (or legal guardian for minors under age 18) for processing special category biometric data.
- **Educational Legitimate Interest (GDPR Art. 6(1)(f))**: Maintenance of accurate classroom attendance records for academic credit accreditation and examination eligibility.
- **India Digital Personal Data Protection (DPDP) Act 2023**: Processing strictly for specified educational purposes with verifiable consent.

---

## 4. Biometric Data Security & Storage Architecture
- **Encryption in Transit**: Strict TLS 1.3 encryption with HTTP Strict Transport Security (`max-age=15552000; includeSubDomains`) and SPKI Certificate Pinning.
- **Encryption at Rest**: AES-256-GCM database encryption across all MongoDB Atlas collections and Hive mobile offline queues.
- **Revocable Access Control**: Access limited to authenticated institutional API keys and role-based permissions (`student`, `teacher`, `admin`, `super_admin`).

---

## 5. Data Retention & Automatic Purge Schedule
| Data Category | Active Retention Period | Archival / Backup | Purge Mechanism |
| :--- | :--- | :--- | :--- |
| **Biometric Vectors** | Enrolled Academic Degree Duration | 30 days post-graduation | Automatic hard delete upon student graduation / departure |
| **Daily Attendance Scans** | Current Academic Year (12 months) | 3 years encrypted cold storage | Aggregated to percentage summaries; raw logs purged |
| **Security Intruder Logs** | 90 days rolling window | Zero cold storage | FIFO truncation at 500 records |
| **User Sessions & Tokens** | 24 hours (JWT access) / 7 days (Refresh) | Zero persistence | Automated MongoDB TTL index expiry |

---

## 6. Student & Guardian Rights (Right to Erasure & Deletion Workflow)
Students and parents maintain absolute rights to:
1. **Inspect Stored Records**: View all attendance stamps and enrollment status directly in the Mobile and Web portal.
2. **Withdraw Biometric Consent**: Opt out of facial recognition at any point and transition to alternative attendance modalities (Dynamic QR / NFC / manual teacher roll-call) without academic penalty.
3. **Right to Erasure ("Right to Be Forgotten")**: Submitting an account deletion request triggers instantaneous cascade deletion of user profile, 512-d embedding records, and session tokens across all databases within 72 hours.
