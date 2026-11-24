# SmartFace Enterprise — Government Tender & RFP Compliance Pack

> **Document Classification**: Official Government Tender & Institutional RFP Dossier  
> **Target Bodies**: Government e-Marketplace (GeM), State Higher Education Councils, Central Universities, Autonomous Polytechnics, and Private Educational Trusts  
> **Document Version**: 2.1.0-GOV-RFP  
> **Effective Date**: November 2026  

---

## 1. Executive Tender Eligibility Overview

SmartFace Enterprise Attendance Platform satisfies technical, architectural, and data sovereignty pre-requisites for competitive government bidding and institutional procurement across India and international jurisdictions:

| Criterion | Government / RFP Mandate | SmartFace Compliance Architecture | Compliance Status |
| :--- | :--- | :--- | :---: |
| **GeM Category** | Cloud-based Biometric & Facial Attendance System | Multi-tenant SaaS containerized architecture with automated provisioning. | ✅ **ELIGIBLE** |
| **Data Sovereignty** | Data must reside strictly within Indian territorial boundaries (MeitY CSP) | Deployed on AWS Asia Pacific (Mumbai `ap-south-1`) with DR in Hyderabad (`ap-south-2`). | ✅ **COMPLIANT** |
| **Biometric Privacy** | No storage of raw photographic biometric PII | Volatile RAM-only processing (`multer.memoryStorage()`); irreversible 512-d float vectors stored. | ✅ **COMPLIANT** |
| **ISO/IEC 27001:2022** | Formal Information Security Management System controls | 93/93 Annex A control requirements met; role-based access control, cryptographic key rotation. | ✅ **AUDIT READY** |
| **SOC 2 Type II** | Trust Services Criteria: Security, Availability, Confidentiality | Continuous automated CI/CD security audits, automated backup drills, zero-trust tenancy. | ✅ **AUDIT READY** |
| **Accessibility** | Equal access for all students (Rights of Persons with Disabilities Act / WCAG 2.1) | WCAG 2.1 Level AA conformance, full keyboard navigation, screen-reader compatible ARIA tags. | ✅ **COMPLIANT** |
| **Alternative Track** | Non-discriminatory fallback for students unable or unwilling to use biometrics | Dynamic cryptographic QR check-in available with identical academic validity. | ✅ **COMPLIANT** |

---

## 2. Technical RFP Specifications (Copy-Paste Bid Clauses)

Institutions drafting competitive tenders may incorporate the following verified specifications:

### Clause 4.1: Biometric Verification Engine
> *"The solution must utilize deep convolutional neural networks (ArcFace / InsightFace) generating 512-dimensional normalized feature embeddings. 1:1 and 1:N matching latency must not exceed 250 milliseconds per frame, with certified True Acceptance Rate (TAR) $\ge 99.0\%$ and False Acceptance Rate (FAR) $\le 0.001\%$ at operating threshold."*

### Clause 4.2: Presentation Attack Detection (Liveness & Anti-Spoofing)
> *"The system must incorporate multi-spectral Presentation Attack Detection (PAD) compliant with ISO/IEC 30107-3 principles. The engine must actively neutralize presentation attacks involving high-resolution printed photos, digital tablet playback, and latex masks with measured spoof rejection $\ge 99.0\%$."*

### Clause 4.3: Zero-Photo Storage & Privacy by Design
> *"Under no circumstances shall raw student facial photographs be written to server persistent storage or unencrypted file systems. Facial images must be held exclusively in volatile RAM during feature vector extraction and permanently purged from memory immediately thereafter."*

### Clause 4.4: Offline Survivability & Fault-Tolerance
> *"Kiosk nodes and mobile applications must function uninterrupted during campus network partitions. Scanned attendance events must be securely buffered in encrypted local SQLite/Hive queues with cryptographic HMAC signatures, automatically replaying idempotently upon network restoration without duplicate double-marking."*

### Clause 4.5: Student Information System (SIS) & LMS Interoperability
> *"The platform must provide native RESTful integration connectors and OneRoster 1.2 CSV compatibility for automated bi-directional synchronization of course rosters, student enrollments, and academic calendars with Canvas, Moodle, and Blackboard."*

---

## 3. SLA & Support Matrix for Government Institutions

| Service Level Parameter | Guaranteed Metric | Remediation / Credit |
| :--- | :--- | :--- |
| **Core API Availability** | $\ge 99.9\%$ Monthly Uptime | $5\%$ SLA credit per $0.1\%$ downtime below threshold |
| **Morning Ingress Latency (p95)**| $< 100\text{ ms}$ for API requests | Auto-scaling horizontal worker pods |
| **P0 Incident Response** | $< 15\text{ minutes}$ (24/7/365 dedicated hotline) | Direct escalation to Principal SRE |
| **Data Backup RPO** | $\le 5.0\text{ minutes}$ (continuous replication) | Point-in-time automated recovery |
| **Disaster Recovery RTO** | $\le 15.0\text{ minutes}$ (cross-zone failover) | Hot secondary container cluster |

---

## 4. Tender Sign-Off & Verification Evidence

All government procurement officers can verify platform compliance electronically via the live machine-readable API:
```bash
curl -f https://api.smartface.pro/api/v1/tender-compliance/audit-pack
curl -f https://api.smartface.pro/api/v1/tender-compliance/specifications
```
