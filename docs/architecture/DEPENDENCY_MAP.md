# SmartFace Ecosystem Dependency & Architecture Map

## 1. Runtime Services & Applications

| Surface | Path | Runtime / Framework | Primary Responsibilities | Internal / External Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Main Web Portal** | `portal/` | Next.js 15.1.12, React 19, TypeScript, Tailwind CSS | Multi-role SaaS dashboards (`student`, `teacher`, `admin`, `parent`, `super_admin`) | `@tanstack/react-query`, `lucide-react`, `qrcode`, `backend/api` REST + WS |
| **Marketing Site** | `landing/` | Next.js 15.5.29, React 19, TypeScript | Public product landing, `/pricing`, `/security`, `/api/demo`, `/api/pilot` | `framer-motion`, `gsap`, `zod` |
| **Core Node.js API** | `backend/api/` | Express, Mongoose, WebSocket (`ws`), Zod | Auth/RBAC, attendance engine, sessions/QR, leave, disputes, reports, analytics, Nexa AI | MongoDB Atlas, optional Redis (`ioredis`/`bullmq`), `groq-sdk`, `backend/ai` |
| **Face Recognition AI** | `backend/ai/` | FastAPI (`backend/ai/app/main.py`), OpenCV, NumPy, InsightFace/ONNX | 1:1 & 1:N ArcFace 512-D verification, embedding extraction, background training | Wraps immutable `core/attendance_system.py` and `core/train_faces.py` via `LegacyAttendanceAdapter` |
| **Mobile App** | `mobile/` | Flutter 3.41.9 / Dart, `provider`, `go_router`, `mobile_scanner` | Cross-platform attendance check-in (QR/biometric), analytics, timetable, offline sync queue | `backend/api`, `flutter_secure_storage`, `shared_preferences` |
| **Shared Packages** | `packages/shared-types/` | TypeScript (`@smartface/shared-types`) | Canonical shared roles, attendance statuses, verification methods, and policy contract | Consumed across JS/TS workspace via root `package.json` & `turbo.json` |

## 2. Student Portal Feature Module Dependency Graph (`portal/src/features/student/`)

- **`portal/src/core/query/queryClient.ts` & `queryKeys.ts`**: Centralized TanStack Query client + user-scoped key factory (`studentKeys`).
- **`portal/src/contexts/AuthContext.tsx`**: Calls `queryClient.clear()` on every login/token switch/logout to prevent cross-student data leaks.
- **`portal/src/hooks/useAttendanceLive.ts`**: WebSocket real-time invalidation with message deduplication and exponential reconnect backoff.
- **Thin App Router Pages (`portal/src/app/student/**/page.tsx`)** -> delegate directly to feature views:
  - `dashboard/` (`StudentDashboardView`)
  - `attendance/` (`StudentAttendanceView`, dynamically split `StudentHeatmapView`)
  - `analytics/` (dynamically split `StudentAnalyticsView`)
  - `checkin/` (dynamically split `StudentCheckinView`, server-confirmed only)
  - `timetable/` (`StudentTimetableView`)
  - `leave/` (`StudentLeaveListView`, `StudentLeaveApplyView`)
  - `notifications/` (`StudentNotificationsView`)
  - `profile/` (`StudentProfileView`)
  - `ai-chat/` (dynamically split `StudentNexaChatView`)

## 3. Confirmed Legacy / Duplicate Notes

- `backend/ai/src/main.py` is the legacy v1 FastAPI entrypoint; `backend/ai/app/main.py` is the active modular FastAPI entrypoint referenced by `backend/ai/railway.json` and `scripts/run.ps1`.
- `mobile/lib/core/network/api_service.dart` (static client used by UI/session screens) coexists with `mobile/lib/core/services/api_service.dart` (injectable deduplicating client wired in `service_locator.dart` for domain services).
- Stale references to removed `frontend/web` paths in `.github/workflows/*.yml`, `Makefile`, and `scripts/exam_preflight.ps1` have been remediated to `landing/` and `portal/`.
