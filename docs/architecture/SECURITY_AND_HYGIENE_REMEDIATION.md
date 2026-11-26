# Security & Hygiene Remediation Report

- **Date**: 2026-11-26
- **Scope**: Repository hygiene, internal service authentication, cache isolation, and client session safety.

## 1. Remediations Implemented & Verified

1. **PII / Credential Dataset Untracking & `.gitignore` Hardening**:
   - Updated `.gitignore` to ignore `data/*.csv`, `data/attendance_history_master.json`, `data/leave_docs/`, `mobile/android/key.properties`, `*.keystore`, `*.jks`, `Reports/`, and `.freebuff/`.
   - Untracked sensitive student/faculty datasets from Git index via `git rm --cached` while preserving local working copies (`git ls-files data/` retains only `data/avatars/avatar_saxhin0708_at_gmail_com_1779646149.webp`).
   - Preserved local Android release signing artifacts (`mobile/android/app/release.keystore`, `mobile/android/key.properties`) untouched on disk while ensuring Git ignores them.
2. **Internal Service Token Fail-Fast (`AI_INTERNAL_TOKEN` / `AI_SERVICE_TOKEN`)**:
   - Updated `backend/ai/app/config.py` and `backend/api/src/services/faceAiService.js` so production environments (`APP_ENV=production` or `NODE_ENV=production`) raise an explicit error if the internal service token is unset instead of silently falling back to a hardcoded default token.
   - Local development keeps the non-production fallback (`dev_internal_ai_token_local_only`).
3. **Authoritative Attendance Verification (No Optimistic Check-in UI)**:
   - Student Portal `StudentCheckinView` and Mobile `QRScannerScreen` confirm attendance **only** after backend persistence and response confirmation.
4. **Cross-Student Cache & Session Isolation**:
   - Next.js Portal (`portal/src/contexts/AuthContext.tsx`) invokes `queryClient.clear()` on `login`, `loginWithCredentials`, `loginWithToken`, and `logout`, and scopes TanStack Query keys by normalized student email (`portal/src/core/query/queryKeys.ts`).
   - Backend API `cache.js` scopes HTTP/user keys cleanly and invalidates user/analytics cache immediately after check-in, dispute resolution, and leave status updates.
   - Flutter `mobile/lib/features/student/screens/student_home_screen.dart` now scopes persisted `student_disputes_<email>` cache keys per authenticated user email alongside `SessionManager.logout()` calling `CacheService.clearMemory()` + `CacheService.clearAll()`.
5. **Audit Log Schema Integrity**:
   - Updated `backend/api/src/models/AttendanceAuditLog.js` action enum to support `PASSWORD_CHANGED`, `PROFILE_UPDATED`, `BIOMETRIC_ENROLLED`, `BIOMETRIC_DELETED`, `PRIVACY_DATA_EXPORTED`, and `ACCOUNT_DELETION_REQUESTED`, eliminating `ValidationError` drops during security/privacy mutations.

## 2. Critical Post-Remediation Actions Required (Operator Owned)

> [!CAUTION]
> **Git History Exposure**: Prior commits in Git history still contain historical versions of `data/student_credentials.csv`, `data/students.csv`, `data/teachers.csv`, and `data/attendance_history_master.json`. Untracking them protects future commits only.
> 1. Rotate all seeded/test/student credentials exposed in prior commits (`student_credentials.csv`) and issue password resets.
> 2. Rotate any API keys (`GROQ_API_KEY`, `RESEND_API_KEY`, `JWT_SECRET`, `AI_INTERNAL_TOKEN`) before production deployment if they were ever shared outside `.env`.
> 3. Run a team-coordinated Git history purge (e.g., `git filter-repo --path data/student_credentials.csv --invert-paths` followed by coordinated force-push) before making any private repository public.
