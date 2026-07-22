# Role-Based Access Control (RBAC) Permission Matrix

## Role Hierarchy & Policy

| Endpoint / API Feature | Student | Teacher / Faculty | Parent | Admin / HOD | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `POST /auth/login-password`, `/auth/login-otp/*` | ✅ | ✅ | ✅ | ✅ | Public Auth Controller |
| `GET /auth/profile`, `PATCH /auth/update-profile` | ✅ (Self) | ✅ (Self) | ✅ (Self) | ✅ (Self) | JWT Bearer Middleware (`auth`) |
| `POST /auth/sessions/logout-all` | ✅ (Self) | ✅ (Self) | ✅ (Self) | ✅ (Self) | `UserSession` Revocation Lookup |
| `POST /attendance/mark`, `/attendance/mark/face` | ✅ | ❌ | ❌ | ❌ | Student Role Guard (`role == 'student'`) |
| `GET /attendance/dashboard`, `/attendance/heatmap` | ✅ (Self) | ❌ | ❌ | ❌ | Student Self-Scope (`student_email`) |
| `POST /sessions/start`, `GET /sessions/live` | ❌ | ✅ | ❌ | ✅ | Teacher/Admin Guard (`role == 'teacher' \|\| 'admin'`) |
| `GET /attendance/command-center`, `/risk-analysis` | ❌ | ✅ | ❌ | ✅ | HOD Command Guard (`403 Forbidden` for Student/Parent) |
| `GET /parent/children`, `/parent/attendance` | ❌ | ❌ | ✅ (Linked) | ✅ | Parent Link Check (`User.children`) |
| `GET /security/logs`, `/attendance/audit-logs` | ❌ | ❌ | ❌ | ✅ | Admin-Only Guard (`adminOnly` middleware) |
| `POST /management/users`, `PATCH /management/roles` | ❌ | ❌ | ❌ | ✅ | Admin-Only Guard (`adminOnly` middleware) |

---

## Security Directives
- **Default-Deny Policy**: Unrecognized routes or missing bearer tokens return `401 Unauthorized`.
- **Client Identity Trust**: Server extracts user email (`sub`) and role (`role`) strictly from the verified JWT payload decoded on the server. Client-submitted role headers or email bodies are ignored for authorization.
