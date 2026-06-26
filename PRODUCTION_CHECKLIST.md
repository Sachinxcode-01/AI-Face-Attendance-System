# SmartFace AI — Production Readiness Checklist

This document details the final verification checklist required to launch the SmartFace AI platform in a production cloud environment.

---

## 1. Secrets & Environment Configurations
- [ ] Ensure that no `.env` files are tracked by Git (check `.gitignore` entries).
- [ ] Audit all client-side files for any hardcoded backend secrets (e.g., JWT secrets, API tokens, database passwords).
- [ ] Confirm that `MONGODB_URL` points to a secure, replica-set Atlas database with TLS/SSL enabled.
- [ ] Verify that `SECRET_KEY` is a minimum 64-character randomized string and is securely injected via runtime containers.
- [ ] Ensure the `FACE_SCANNER_TOKEN` matches exactly between Node API Gateway and Python Face Recognition Core.

## 2. API Gateway Security & CORS
- [ ] Verify that `NODE_ENV` and `APP_ENV` are set to `production`.
- [ ] Audit that `CORS_ORIGINS` does not contain wildcards (`*`) and strictly lists the production domains.
- [ ] Confirm HTTP Security Headers are active:
  - `X-Frame-Options: DENY` (prevents Clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Referrer-Policy: no-referrer`
- [ ] Verify rate limiting memory thresholds (Registration max 3 per 5 mins, OTP max 3 per min).

## 3. Database Indexes & Performance
- [ ] Run indexes seeding on MongoDB. Important collections must have indexing:
  - `User`: `{ email: 1 }` (unique)
  - `Attendance`: `{ student_email: 1, session_id: 1 }` (unique compound index to prevent duplicate marks)
  - `Leave`: `{ user_id: 1, status: 1 }`
- [ ] Verify that query response times are under `300ms` for dashboard loads.

## 4. Frontend & Mobile Assets
- [ ] Run Next.js optimization compilation (`npm run build`). Verify that bundle splitting successfully segments large Three.js canvas packages out of initial loading screens.
- [ ] Confirm that `NEXT_PUBLIC_API_URL` correctly points to the secure HTTPS API endpoint.
- [ ] Compile production-signed Flutter packages (Android App Bundle & iOS IPA).
- [ ] Confirm Flutter local notifications permission configurations for Android 13+.

## 5. WebSockets & Real-Time Setup
- [ ] Verify WebSocket upgrade handles and tokens. Check if Nginx or load balancer reverse proxy is configured with `Connection: upgrade` headers.
- [ ] Test notification push delivery over `ws/notifications?token=<JWT>`.
