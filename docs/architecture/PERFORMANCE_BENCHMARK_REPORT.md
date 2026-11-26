# SmartFace Performance Benchmark Report

- **Date**: 2026-11-26
- **Environment**: Windows (`win32`), 12 CPUs, Node.js `v25.1.0`, Python `3.10.11`, Next.js `15.1.12` (`portal`) & `15.5.29` (`landing`), Flutter `3.41.9`, MongoDB Atlas (`smartface` DB over network RTT).

## 1. Frontend Bundle Comparison (`portal/`)

Measured via `cd portal && npm run build`:

| Route | Baseline Route / First Load JS | Post-Optimization Route / First Load JS | Notes |
| :--- | :--- | :--- | :--- |
| `/` | `67.8 kB` / `209 kB` | `69.9 kB` / `220 kB` | Converted to Server Component + `next/dynamic` below-fold sections; shared JS includes `@tanstack/react-query` (`QueryProvider`) for session-safe clearing in `AuthContext` |
| `/teacher/qr-projector` | `12.7 kB` / `160 kB` | `4.09 kB` / `160 kB` | **`-8.61 kB` route chunk** by dynamic importing `qrcode` on session token projection |
| `/student` | `5.45 kB` / `152 kB` | `9.04 kB` / `169 kB` | Feature-modularized with TanStack Query request deduplication, cancellation, and `queryClient.clear()` on auth transitions |
| `/student/attendance/heatmap` | — | `4.04 kB` / `164 kB` | Route-level `next/dynamic` split |
| `/student/ai-chat` | — | `6.39 kB` / `166 kB` | Route-level `next/dynamic` split |
| `/student/analytics` | — | `7.42 kB` / `167 kB` | Route-level `next/dynamic` split |
| `/student/checkin` | — | `8.37 kB` / `168 kB` | Route-level `next/dynamic` split; zero optimistic attendance confirmation |

`landing/` compiled cleanly (`20/20` static pages, `/` = `40.9 kB` / `243 kB` First Load JS, shared JS = `103 kB`).

## 2. Node.js API & Database Latency (`scripts/load_testing/benchmark_endpoints.js`)

Measured against local Express (`NODE_ENV=test`, `127.0.0.1`) connected to MongoDB Atlas (`smartface` DB):

- **Cold `GET /analytics/trends`**: `2228.17 ms`

| Endpoint | Iterations | p50 (ms) | p95 (ms) | p99 (ms) | Min / Max (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /analytics/trends` (warm cache `X-Cache: HIT`) | 30 | `3.54` | `11.11` | `19.09` | `1.23` / `19.09` |
| `GET /academic/holidays` (`cache.getOrLoad`) | 30 | `70.25` | `118.97` | `267.30` | `60.78` / `267.30` |
| `GET /academic/timetable` (normalized keys) | 20 | `209.91` | `2304.36` | `4248.36` | `179.74` / `4248.36` |
| `GET /attendance/dashboard` (aggregated + cached policy) | 15 | `217.96` | `320.71` | `320.71` | `201.04` / `320.71` |
| `GET /attendance/history/alice@smartface.pro` | 15 | `498.29` | `2324.53` | `2324.53` | `465.49` / `2324.53` |
| `POST /api/assistant/chat/stream` (SSE fallback) | 10 | `581.65` | `4827.37` | `4827.37` | `561.64` / `4827.37` |

**Note on `POST /api/assistant/chat/stream`**: The configured `GROQ_API_KEY` environment returned `404 model_not_found` for tested Groq models (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`), so measured latency reflects the upstream Groq roundtrip before cleanly failing over to deterministic KB SSE streaming.

## 3. Python Face AI Latency (`backend/ai`)

Measured via `.\venv\Scripts\python.exe` on CPU (`CUDAExecutionProvider` unavailable locally due to missing CUDA DLLs, cleanly handled by `CPUExecutionProvider` fallback):

- **Cold `LegacyAttendanceAdapter` initialization** (5 ONNX `buffalo_l` models + 13 enrolled student encodings): `8557.75 ms`
- **`verify_face` on 3200x2400 image with bounded `960px` pre-downscaling**: `1183.43 ms` (`NO_FACE` detection cycle on CPU)
- **`pytest backend/ai/tests -q`**: `13 passed, 1 warning in 26.29s` (down from `51.21s` initial baseline / `37.56s` after core restore).

## 4. Test Verification Summary

- `portal/`: `npm run typecheck && npm run build` — **PASSED** (`exit 0`, 37/37 static pages).
- `landing/`: `npm run typecheck && npm run build` — **PASSED** (`exit 0`, 20/20 static pages).
- Root workspace: `npm run typecheck:web` — **PASSED** (`exit 0`).
- `backend/api` Unit Tests:
  - `tests/unit/test_attendance_calculator.js` — **10/10 PASSED**.
  - `tests/unit/test_nexa_phase2.js` — **10/10 PASSED** (including new SSE `/api/assistant/chat/stream` verification).
  - `tests/unit/test_nexa_assistant.js` — **PASSED**.
  - `tests/run_all.js` unit suite — **12/12 PASSED**.
- `backend/api` Integration Tests:
  - `tests/integration/run_student_portal_validation.js` — **10/10 PASSED**.
  - `tests/run_all.js` integration suite — **6/7 PASSED**; `run_academic_validation.js` passed `/academic/dashboard` & `/academic/timetable` (after alias normalization fix) and failed at `/academic/assignments` because the connected Atlas database currently contains no seeded `Assignment` records (`Assignments list empty: no homework items found`).
- `backend/ai`: `pytest backend/ai/tests -q` — **13/13 PASSED** in `26.29s` (with SHA-256 verification of unchanged `core/attendance_system.py` and `core/train_faces.py`).
- `mobile/` Flutter Targeted Tests (`--no-pub -j 1`):
  - `test/session_manager_test.dart` — **5/5 PASSED**.
  - `test/api_service_test.dart`, `test/sync/offline_sync_test.dart`, `test/ai_chat_test.dart`, `test/analytics_dashboard_test.dart`, `test/widgets/feature_screens_test.dart` — **22/22 PASSED** (total **27/27 targeted tests passed**). Full-repo `flutter test` without `--no-pub -j 1` and `dart analyze lib/` stalled on Windows OneDrive and remain unverified as a single full sweep.
