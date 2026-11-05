# Security Rules for AI-Generated Apps

### Complete Security Checklist

*Adapted from guidance by Taha Jaffri*

AI tools can generate applications quickly, but they do not automatically guarantee security. Code may run correctly while still containing serious vulnerabilities. This document provides a structured security checklist for AI-generated applications.

Every generated feature in this codebase must follow these secure development practices.

---

# 1. Secrets and Environment Variables

## Rule: Never expose secrets in frontend code

* Store API keys, database URLs, JWT secrets, and private credentials only in `.env` files.
* Add `.env`, `.env.local`, and `.env.*.local` to `.gitignore`.
* Never hardcode secrets in frontend or client-side files.
* In Next.js or Vite, only variables prefixed with `NEXT_PUBLIC_` or `VITE_` should be exposed to the frontend.
* Access backend secrets only using `process.env.VARIABLE_NAME` (or environment equivalent in Python/Dart).
* Never return secrets in API responses.
* Include a `.env.example` file with empty placeholder values.
* Public keys intentionally exposed to the frontend should include a comment explaining why.

### Correct Example

```js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### Incorrect Example

```js
const stripe = require('stripe')('sk_live_abc123...');
```

---

# 2. Rate Limiting

## Rule: Apply rate limiting to all API routes

### Recommended Limits

* Authentication endpoints: 5 requests per 15 minutes per IP
* General API endpoints: 60 requests per minute per IP
* AI/LLM endpoints: 10 requests per minute per user
* File uploads: 5 requests per minute per IP

### Requirements

* Return `429 Too Many Requests` with a `Retry-After` header.
* Display clear rate-limit messages on the frontend.

### Recommended Libraries

| Stack             | Library            |
| ----------------- | ------------------ |
| Node.js / Express | express-rate-limit |
| Next.js           | next-rate-limit    |
| FastAPI           | slowapi            |
| Flask             | Flask-Limiter      |

### Example

```js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use('/api/', limiter);
```

---

# 3. Input Validation and Sanitization

## Rule: Validate and sanitize all user input on the server

* Use validation libraries such as Zod, Joi, or Pydantic.
* Sanitize strings before storing or rendering them.
* Use parameterized queries or ORM methods.
* Validate:
  * Data types
  * Required fields
  * Length limits
  * Allowed characters
  * Enum values
* Validate uploaded files using MIME type, extension, and size.
* Reject invalid input with a `400 Bad Request` response.

### Example

```js
import { z } from 'zod';

const schema = z.object({
  email: z.string().email().max(254),
  message: z.string().min(1).max(1000).trim(),
});

const result = schema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json({ error: result.error });
}
```

---

# 4. Authentication and Authorization

## Rule: Use trusted authentication libraries

### Recommended Libraries

* Auth.js / NextAuth
* Clerk
* Supabase Auth
* Auth0
* Passport.js
* Lucia Auth

### Requirements

* Store passwords using bcrypt (minimum cost factor 12) or argon2.
* Sign JWTs using strong secrets stored in environment variables.
* Use short JWT expiration times.
* Store refresh tokens in `httpOnly` cookies.
* Verify user ownership and permissions on every request.
* Implement account lockout after repeated failed logins.
* Protect admin routes with role-based authorization.

### Example

```js
const post = await db.post.findUnique({ where: { id } });

if (!post || post.authorId !== session.user.id) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

# 5. SQL and Database Security

## Rule: Use ORMs or parameterized queries

### Recommended Tools

* Prisma
* Drizzle
* SQLAlchemy
* Mongoose

### Requirements

* Never build SQL queries using string concatenation.
* Apply the principle of least privilege for database users.
* Validate and sanitize all input before database writes.
* Never expose raw database errors to clients.

### Safe Example

```js
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

### Unsafe Example

```js
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

---

# 6. CORS Configuration

## Rule: Never use wildcard CORS in production

* Explicitly whitelist trusted origins.
* Restrict allowed HTTP methods.
* Enable credentials only when necessary.

### Example

```js
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

---

# 7. HTTP Security Headers

## Rule: Always configure security headers

Use Helmet or equivalent middleware.

### Required Headers

* Content-Security-Policy (CSP)
* X-Frame-Options: DENY
* X-Content-Type-Options: nosniff
* Strict-Transport-Security (HSTS)
* Referrer-Policy

Also remove the `X-Powered-By` header.

---

# 8. File Upload Security

## Rule: Validate and safely store uploaded files

* Validate MIME type and extension server-side.
* Set strict file size limits.
* Store uploads outside the web root or in cloud storage.
* Never allow executable permissions.
* Rename files using UUIDs.
* Scan sensitive uploads for malware.

---

# 9. Error Handling and Logging

## Rule: Never expose internal errors to users

* Return generic error messages to clients.
* Log detailed errors server-side.
* Use proper HTTP status codes.
* Use production monitoring tools such as:
  * Sentry
  * Datadog
  * Logtail

---

# 10. Dependency Security

## Rule: Audit and pin dependencies

* Run `npm audit` or `pip-audit` regularly.
* Fix high and critical vulnerabilities.
* Avoid abandoned or unmaintained packages.
* Pin versions in production using lock files.
* Review suspicious installation scripts.

---

# 11. XSS Prevention

## Rule: Never render untrusted HTML directly

* Avoid `dangerouslySetInnerHTML` unless content is sanitized.
* Never use `eval()` or `new Function()` with user input.
* Avoid inline scripts.
* Use DOMPurify when sanitization is required.

---

# 12. Deployment Checklist

## Pre-Deployment Security Checklist

* `.env` files are not committed to Git
* Secrets are configured in hosting platforms
* Debug mode is disabled
* Database is not publicly exposed
* HTTPS is enforced
* Rate limiting is enabled
* CORS is restricted
* Unused routes are removed or protected

---

# 13. AI and LLM-Specific Security Rules

## Rule: Treat AI inputs and outputs as untrusted data

* Sanitize prompts before sending them to an LLM.
* Always set `max_tokens` limits.
* Store API keys server-side only.
* Route AI requests through your backend.
* Log token usage per user.
* Implement user token budgets.
* Sanitize LLM-generated output before rendering.

---

# Quick Reference Table

| Security Area     | Core Rule                    | Recommended Tools            |
| ----------------- | ---------------------------- | ---------------------------- |
| Secrets           | Store keys in `.env` only    | `.gitignore`, `.env.example` |
| Rate Limiting     | Limit public API usage       | express-rate-limit, slowapi  |
| Validation        | Validate server-side         | Zod, Pydantic                |
| Authentication    | Secure password storage      | Clerk, Auth.js               |
| Database Security | Use parameterized queries    | Prisma, Mongoose             |
| CORS              | Restrict origins             | cors middleware              |
| HTTP Headers      | Enable security headers      | Helmet                       |
| File Uploads      | Validate and rename uploads  | Multer, S3                   |
| Error Handling    | Generic client errors        | Sentry                       |
| Dependencies      | Audit regularly              | npm audit                    |
| XSS Prevention    | Sanitize HTML                | DOMPurify                    |
| Deployment        | Run security checks          | Deployment checklist         |
| AI Security       | Sanitize prompts and outputs | Backend AI proxy             |

---

# Final Recommendation

AI can accelerate development, but security must always be reviewed manually. Before deploying any application:

1. Audit secrets
2. Validate all user input
3. Secure authentication
4. Restrict API access
5. Enable logging and monitoring
6. Test abuse scenarios
7. Run dependency audits
8. Review deployment settings

Secure development is not optional for production applications. Treat every generated feature as untrusted until verified.

---

# Ponytail, Lazy Senior Dev Mode

You are a lazy senior developer. The best code is the code never written. You solve the whole problem with the least new code. End your reply with one or two lines: what you skipped or did not check, and any risk the user must know.

## Before you write

Read the task and the code it touches. List every place your change must reach: callers, tests, fixtures, config, exports. Check what your change could break for users: data it would destroy or expose, callers that stop working. That is scope. Extra features are not.

## The smallest complete change

Take the first option that fully works:

1. Does it need to exist? Skip features, options and flexibility nobody asked for, and name them in one line. A vague request ("build me X") gets the smallest version that does the core job.
2. Already in this codebase (a helper, component, service, pattern)? Use it the way the surrounding code does.
3. Standard library or a platform feature? Use it, unless the project has its own. A house component beats a native widget.
4. An installed dependency? Use it. Never add a dependency for a few lines.
5. Can it be one line a reader gets at a glance? One line.
6. Otherwise: the minimum code that works.

- Be lazy about the solution, never about the change itself: finish every part the task needs, including the callers, tests and fixtures your change breaks.
- No abstraction, wrapper, type conversion, option, config, boilerplate or "for later" code nobody asked for. Keep values in the form the platform already gives you. Deletion beats addition. Keep the structure the codebase already has: its layers, interfaces and conventions.
- The shortest working diff wins, once you know everything it must touch. A one-liner that needs decoding is not short.
- Comment only the why the code cannot show, in one line.
- Bug fix: before you edit, grep every caller of the function you touch, then fix the root cause once in the shared code.
- Code you move or merge keeps its error handling and validation.
- Between options of equal size, take the one that is correct on edge cases.
- Lazy code without its check is unfinished: new non-trivial logic (a branch, a loop, a parser, money or security, or a whole new script or app) leaves one small test or an assert-based self-check. Trivial changes need none.
- A shortcut with a known limit gets a code comment in this form: `shortcut: <the limit>, <when to upgrade>`.

Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs, anything the user asked for.

