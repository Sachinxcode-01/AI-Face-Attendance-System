# ADR-001: Incremental Monorepo Structure & Modular Boundaries

- **Status**: Accepted
- **Date**: 2026-11-26

## Context

SmartFace consists of five independently deployed surfaces (`portal/`, `landing/`, `backend/api/`, `backend/ai/`, `mobile/`) plus immutable legacy biometric engines (`core/attendance_system.py`, `core/train_faces.py` verified via SHA-256 checksums in `backend/ai/tests/test_face_api.py`). Moving these directories immediately into `apps/` and `services/` would break active Vercel project root settings, Railway build contexts (`backend/api/railway.json`, `backend/ai/railway.json`), and Android/Flutter CI paths.

## Decision

1. **Preserve Active Deployment Roots**: Keep `portal/`, `landing/`, `backend/api/`, `backend/ai/`, and `mobile/` at their existing root paths while removing stale references to `frontend/web` across `.github/workflows/*.yml`, `Makefile`, and `scripts/exam_preflight.ps1`.
2. **Adopt Root npm Workspaces & Turborepo Pipeline**: Configure `package.json` workspaces (`portal`, `landing`, `backend/api`, `packages/*`) and `turbo.json` for dependency-aware JS/TS builds and typechecking, while keeping Flutter (`mobile/pubspec.yaml`) and Python (`pyproject.toml`, `backend/ai/requirements.txt`) native to their own toolchains.
3. **Feature-Based Portal Architecture**: Modularize Student Portal features under `portal/src/features/student/<domain>/` with scoped TanStack Query keys (`portal/src/core/query/queryKeys.ts`), zero optimistic attendance confirmation, and route-level dynamic splitting (`next/dynamic`) for heavy views (`checkin`, `analytics`, `heatmap`, `ai-chat`, `teacher/qr-projector`).
4. **Domain-Scoped Backend Helpers**: Consolidate deterministic attendance rules in `backend/api/src/services/attendanceCalculator.js`, policy/timetable lookup in `studentAttendanceService.js`, tenant-aware caching in `backend/api/src/utils/cache.js`, and bounded inference preprocessing inside `backend/ai/app/adapters/legacy_attendance_adapter.py`.

## Consequences & Rollback

- **Benefits**: Zero deployment downtime, centralized workspace commands (`npm run typecheck:web`, `npm run build:web`, `npm run test:api`), eliminated N+1 report queries, and strict session cache isolation.
- **Migration to `apps/` & `services/`**: Once hosting dashboards (Vercel root dirs & Railway service paths) are updated in lockstep, `portal/` -> `apps/portal`, `landing/` -> `apps/landing`, `mobile/` -> `apps/mobile`, `backend/api/` -> `services/api`, and `backend/ai/` -> `services/face-ai` can be moved cleanly by updating workspace globs in `package.json`.
- **Rollback**: Every optimization is localized to internal modules behind preserved API routes and Next.js routes; `git revert` restores prior behavior without database schema drops or client breaking changes.
