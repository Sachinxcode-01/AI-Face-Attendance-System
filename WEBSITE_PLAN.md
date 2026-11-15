# SmartFace Website Implementation Plan

## Project Overview

Building two separate Next.js 15 applications with a shared design system:
1. **Landing Page** (`/`) — Marketing/informational site
2. **Main Portal** (`/portal/*`) — Role-based attendance management for Student, Parent, Teacher, Admin

---

## 1. HIGH-LEVEL ARCHITECTURE

```
smartface-website/
├── apps/
│   ├── landing/                    # Next.js 15 - Marketing landing page
│   ├── portal/                     # Next.js 15 - Role-based management portal
│   └── backend/                    # Standalone backend API (Node.js/Express + TypeScript)
│
├── packages/
│   └── design-system/              # Shared design tokens & components (from design.md)
│
├── turbo.json                      # Turborepo config (monorepo)
├── package.json                    # Root workspace config
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example
└── README.md
```

---

## 2. DESIGN SYSTEM IMPLEMENTATION (from design.md)

### Color Tokens

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `primaryIndigo` / `primary` | `#3D4AB8` / `#4F46E5` | — | Hero banner, primary text links |
| `orbLight` / `orbDark` | `#9AA4EC` / `#4D58C0` | — | Hero radial gradient orbs |
| `pageBg` | `#E8EAF6` | `#070A14` | Whole-screen canvas |
| `cardBg` | `#FFFFFF` | `#141D38` | Content cards |
| `textHeading` | `#1A1A3A` | `#F1F3F9` | Titles, headings |
| `textBody` | `#3D4260` | `#C8CCDF` | Body text, descriptions |
| `textLabel` | `#A0A0B8` | `#7C82A0` | Form labels |
| `textPlaceholder` | `#C8C8D8` | `#4B5170` | Input placeholders |
| `borderFocused` | `#4F46E5` | `#6366F1` | Focused input border |
| `selectedCardBg` | `#EEF2FF` | `#1A2340` | Selected role cards |
| `success` | `#10B981` | — | Success states |
| `warning` | `#F59E0B` | — | Warning states |
| `error` | `#EF4444` | — | Error states |

### Typography

- **Poppins** for display/headings (800/700/600 weights)
- **Inter** for body/labels/inputs (400/600 weights)
- Sizes and line-heights exactly as specified in design.md Section 4

### Layout Architecture (design.md AuthScreenLayout)

```
Scaffold (Background: #E8EAF6)
│
├── HERO BAND (Height: statusBarHeight + 115px)
│   - Base: #3D4AB8 (primaryIndigo)
│   - Orbs: 4 decorative gradient orbs
│   - Back button: [ < Back ]
│   - 28px visual overlap
│
└── WHITE CONTENT CARD SHELL
    - BorderRadius: Top-Left 28px, Top-Right 28px
    - Background: #FFFFFF (Light) / #141D38 (Dark)
    - Shadow: blur 30px, y: -5px
    - Padding: horizontal 5.6% of screen width
    - Scrollable content area
    - Form fields with UnderlineTextField
    - Primary Button: 52px Gradient #6366F1 -> #4F46E5
    - Social Auth Row: Google & GitHub
    - Bottom footer navigation link
```

---

## 3. LANDING PAGE (apps/landing)

### Structure

```
apps/landing/app/
├── layout.tsx          # Root layout with fonts, metadata
├── page.tsx            # Hero landing page
├── features/
│   └── page.tsx        # Features detail
├── how-it-works/
│   └── page.tsx        # 3-4 step visual flow
├── demo/
│   └── page.tsx        # Interactive demo / screenshots
├── role-portals/
│   └── page.tsx        # Student/Parent/Teacher/Admin portal preview
├── testimonials/
│   └── page.tsx
├── pricing/
│   └── page.tsx
├── about/
│   └── page.tsx
├── contact/
│   └── page.tsx        # Contact form + newsletter
├── api/
│   ├── contact/
│   └── newsletter/
└── globals.css         # Tailwind imports + design-system colors
```

### Sections (per design spec)

1. **Hero** — Gradient background with orbs, headline, CTA buttons
2. **Problem/Solution** — Pain points vs SmartFace value
3. **Key Features** (6-8 cards) — ArcFace, Anti-Proxy QR, Analytics, Multi-role Portals, Automated Reports, Intruder Detection, Leave Management, Mobile + Web
4. **How It Works** — 3-4 step visual flow
5. **Role-Based Portals Preview** — Screenshots/features for Student/Parent/Teacher/Admin
6. **Testimonials / Case Studies**
7. **Pricing / Plans**
8. **FAQ**
9. **Footer** — Links, social, newsletter signup

### Technical

- SSR/SSG for SEO
- Framer Motion animations
- Responsive mobile-first
- Dark mode support (per design.md tokens)
- WCAG 2.1 AA accessibility
- LCP < 2.5s, CLS < 0.1

---

## 4. MAIN PORTAL (apps/portal)

### Route Structure & Role-Based Access

```
/portal
├── /auth (public)              # login, register, forgot, reset, verify
├── /student (protected)        # dashboard, attendance, timetable, leave, ai-chat, profile
├── /parent (protected)         # dashboard, children, child/[id], notifications, settings
├── /teacher (protected)        # dashboard, sessions, qr-projector, kiosk, roster, leave-approvals, analytics, timetable
└── /admin (protected)          # dashboard, telemetry, intruder-sentinel, directory, arcface-calibration, audit-trail, reports, settings
```

### Protected Routes

```typescript
// middleware.ts
export function hasAccess(userRole: UserRole, path: string): boolean {
  const allowedPaths = roleRoutes[userRole] || [];
  return allowedPaths.some(p => path.startsWith(p));
}
```

### Navigation per Role

| Role | Nav Items |
|------|-----------|
| Student | Dashboard, Attendance, Timetable, Leave, AI Chat, Profile |
| Parent | Dashboard, Children, Child detail, Notifications, Settings |
| Teacher | Dashboard, Sessions, QR Projector, Kiosk, Roster, Leave Approvals, Analytics, Timetable |
| Admin | Dashboard, Telemetry, Intruder Sentinel, Directory, ArcFace Calibration, Audit Trail, Reports, Settings |

---

## 5. BACKEND API (apps/backend)

### Technology Stack

- **Node.js 20** + **Express** + **TypeScript**
- **Prisma** + **PostgreSQL**
- **JWT** in httpOnly cookies + refresh token rotation
- **Zod** for input validation
- **express-rate-limit** for rate limiting
- **Helmet** for security headers
- **Socket.io** for real-time notifications

### Database Schema (Prisma)

Key models: `User`, `BiometricProfile`, `Session`, `Attendance`, `Leave`, `Timetable`, `Notification`, `AuditLog`, `RefreshToken`, `SecurityLog`

Role enum: `STUDENT | PARENT | TEACHER | ADMIN | SUPER_ADMIN`

### API Routes

| Category | Endpoints |
|----------|-----------|
| Auth | POST `/register`, `/login`, `/logout`, `/refresh`, `/forgot`, `/reset`, `/verify` |
| Users | GET `/me`, PUT `/me`, GET `/:id` (admin CRUD) |
| Students | Attendance, timetable, profile |
| Parents | Child linking, child data access |
| Teachers | Sessions, roster, leave approvals |
| Sessions | POST `/start`, `/stop`, GET `/active`, `/history` |
| Attendance | POST `/mark` (QR/face), GET `/dashboard`, `/history` |
| Leave | POST `/apply`, GET `/history`, `/pending`, PATCH `/action` |
| Timetable | CRUD, GET `/my-timetable` |
| Reports | GET `/export`, `/generate`, `/dispatch` |
| Analytics | GET `/command-center`, `/risk-analysis`, `/department` |
| Security | GET `/intruders`, `/audit-logs` |
| ArcFace | POST `/enroll`, `/verify` (proxy to Python FastAPI) |
| AI | POST `/chat`, GET `/insights/:studentId` |

### Security (per CLAUDE.md)

- [ ] Rate limiting on all routes
- [ ] Zod validation on all inputs
- [ ] bcrypt cost factor 12 for passwords
- [ ] JWT secrets in env, short expiry (15m), refresh in httpOnly cookies
- [ ] Role verification on every protected request
- [ ] Parameterized queries via Prisma (no raw SQL)
- [ ] CORS restricted to explicit origins
- [ ] Helmet.js security headers
- [ ] Generic error messages to clients, detailed server logs
- [ ] `npm audit` in CI
- [ ] DOMPurify for any HTML rendering
- [ ] File upload validation (MIME type, extension, size, UUID rename)
- [ ] Pre-deployment checklist verification

---

## 6. DEVELOPMENT PHASES

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Foundation | 2 weeks | Monorepo setup, design-system package, app scaffolds |
| 2. Landing Page | 2 weeks | Production-ready marketing landing page |
| 3. Auth System | 2 weeks | Complete auth (frontend + backend) with JWT cookies |
| 4. Student Portal | 2 weeks | Full student experience (check-in, timetable, leave, AI chat) |
| 5. Parent Portal | 1.5 weeks | Parent dashboard + child views + notifications |
| 6. Teacher Portal | 2 weeks | Sessions, QR projector, kiosk, roster, analytics, exports |
| 7. Admin Portal | 2 weeks | Full admin sentinel panel (telemetry, directory, calibration, audit, reports) |
| 8. Backend API Completion | 2 weeks | All CRUD endpoints, WebSockets, Python AI proxy, integrations |
| 9. Integration & Polish | 2 weeks | E2E testing, security audit, performance optimization, deployment |
| **Total** | **~17 weeks** | **Production-ready platform** |

### Phase Milestones

- **Phase 1**: Turborepo + pnpm workspaces, design-system tokens (all from design.md), shared Tailwind preset, TypeScript/ESLint/Prettier configs, Docker Compose for PostgreSQL + Redis
- **Phase 2**: Landing hero with orb gradients, features cards, how-it-works flow, role-portals preview, dark mode, contact form, SEO optimization
- **Phase 3**: Backend auth routes (register, login, logout, refresh, forgot/reset), JWT + httpOnly cookie, email service (Resend/SendGrid), rate limiting on auth endpoints, portal auth pages, auth context/provider, role-based middleware and redirects
- **Phase 4**: Student dashboard with stats/streak, face check-in page (webcam + backend), QR scanner, attendance history, timetable view, leave apply + history, AI chat integration, profile & settings
- **Phase 5**: Parent dashboard with children overview, child detail pages (attendance/timetable/leave/reports), notifications center, settings
- **Phase 6**: Teacher dashboard (today's sessions/stats), session management (create/start/stop/history), full-screen QR projector (15s rotation), biometric kiosk mode, roster with manual override, leave approval inbox, analytics (command center, risk radar), export (CSV/Excel/PDF)
- **Phase 7**: Admin dashboard (telemetry), intruder sentinel (live feed + gallery), user directory CRUD (students/teachers/departments), ArcFace calibration (5-angle enrollment), audit trail viewer, reports generator + dispatcher, system settings (anti-proxy, hardware, integrations), system health monitoring
- **Phase 8**: All CRUD endpoints, WebSocket server for real-time notifications, ArcFace integration (proxy to existing Python FastAPI microservice), Google Sheets sync, PDF report generation, email notifications, comprehensive tests
- **Phase 9**: E2E testing, performance optimization, accessibility audit (WCAG 2.1 AA), security audit (per CLAUDE.md checklist), documentation, deployment to Vercel + Railway/Render, CI/CD pipelines

---

## 7. KEY TECHNICAL DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo Tool | Turborepo + pnpm | Fast builds, caching, shared packages |
| Styling | Tailwind CSS + design-system tokens | Matches design.md exactly |
| State Management | React Context + TanStack Query | Server state, minimal boilerplate |
| Forms | React Hook Form + Zod | Type-safe validation |
| Auth | JWT in httpOnly cookies + refresh rotation | Secure, CSRF-resistant |
| Database | PostgreSQL + Prisma | Type-safe, migrations, relations |
| Real-time | Socket.io (Node) | Notifications, live updates |
| Face AI | Proxy to existing Python FastAPI service | Reuse existing ArcFace microservice |
| PDF Reports | @react-pdf/renderer | Client or server generation |
| Charts | Recharts / Tremor | Dashboard analytics |
| Deployment | Vercel (frontend) + Railway/Render (backend) | Simple, scalable |

---

## 8. ENVIRONMENT VARIABLES

### Landing (`apps/landing/.env.example`)

```env
NEXT_PUBLIC_SITE_URL=https://smartface.pro
NEXT_PUBLIC_PORTAL_URL=https://portal.smartface.pro
RESEND_API_KEY=
CONTACT_EMAIL=
```

### Portal (`apps/portal/.env.example`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

### Backend (`apps/backend/.env.example`)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/smartface
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=noreply@smartface.pro
FACE_SCANNER_TOKEN=
PYTHON_AI_URL=http://localhost:8001
PYTHON_AI_TOKEN=
GOOGLE_SHEETS_CREDENTIALS=
REDIS_URL=redis://localhost:6379
```

---

## 9. SECURITY CHECKLIST (per CLAUDE.md)

- [ ] All secrets in `.env` files (never in code)
- [ ] `.env` in `.gitignore`
- [ ] Rate limiting on all API routes
- [ ] Zod validation on all inputs
- [ ] bcrypt cost factor 12 for passwords
- [ ] JWT secrets in env, short expiry, refresh in httpOnly cookies
- [ ] Role verification on every protected request
- [ ] Parameterized queries via Prisma (no raw SQL)
- [ ] CORS restricted to explicit origins
- [ ] Helmet.js security headers
- [ ] File upload validation (MIME, size, rename to UUID)
- [ ] Generic error messages to clients, detailed server logs
- [ ] `npm audit` / `pnpm audit` in CI
- [ ] DOMPurify for any HTML rendering
- [ ] Pre-deployment checklist verification

---

## 10. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      CDN / Edge (Vercel)                     │
├──────────────────────┬──────────────────────────────────────┤
│  landing.smartface.pro (Next.js SSG/ISR)                    │
│  portal.smartface.pro  (Next.js SSR + Middleware)           │
└──────────────────────┴──────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Railway/Render)              │
│  apps/backend (Node.js Express + Socket.io)                 │
│  - REST API                                                 │
│  - WebSocket Server                                         │
│  - Rate Limiting, Auth, Validation                          │
└──────────────────────┬──────────────────────────────────────┤
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌───────────────┐ ┌────────────┐ ┌────────────────┐
│  PostgreSQL   │ │   Redis    │ │ Python AI Svc  │
│  (Managed)    │ │  (Cache/   │ │  (FastAPI      │
│               │ │   Sessions)│ │   ArcFace)     │
└───────────────┘ └────────────┘ └────────────────┘
```

---

## 11. NEXT STEPS

1. **Confirm the plan** — Review and approve this architecture
2. **Initialize monorepo** — Set up Turborepo + pnpm workspaces
3. **Build design-system** — Extract all tokens from design.md into shared package
4. **Scaffold apps** — Create landing, portal, backend with shared configs
5. **Begin Phase 1 implementation**

---

*This plan follows the SmartFace design system (design.md) exactly and implements security best practices from CLAUDE.md. The monorepo structure enables code sharing while maintaining clear separation between the marketing landing page and the role-based management portal.*