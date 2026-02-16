# Security Audit — 2026-02-16

Three parallel audits covering auth & API routes, input validation & injection, and client-side / secrets / headers.

---

## CRITICAL — Fix immediately

| # | Issue | File(s) | Recommendation |
|---|-------|---------|----------------|
| S1 | **Unauthenticated debug endpoint** — `GET /api/dinners/:id/debug` has no auth and leaks dinner state, bottle details, and ratings. Also still uses the old Supabase client (stale code). | `app/api/dinners/[id]/debug/route.ts` | **Delete this file entirely.** |
| S2 | **IDOR — unauthenticated user profile read** — `GET /api/users/:id` has no auth check. Anyone can read any user's full profile including email, total spent, ratings history, and bottles brought. | `app/api/users/[id]/route.ts:7` | Add `requireAuth()` at the top of the GET handler. |
| S3 | **IDOR — unauthenticated user profile write** — `PATCH /api/users/:id` verifies the user is authenticated but never checks they own the profile. Any logged-in user can update any other user's photo URL by changing the `:id`. | `app/api/users/[id]/route.ts:158` | Add `if (auth.userId !== userId) return 403`. |
| S4 | **Wildcard CORS on all routes** — `Access-Control-Allow-Origin: *` is set globally. The comment says "local network access" but this applies to production too, enabling cross-origin API calls from any site. | `next.config.ts:25` | Restrict to your production domain (or remove entirely — Next.js does not need explicit CORS for same-origin clients). |
| S5 | **JWT secret is a placeholder** — `.env.local` has `JWT_SECRET=your_jwt_secret_min_32_characters`. Tokens signed with a guessable secret can be forged. | `.env.local:5` | Generate with `openssl rand -base64 48` and replace. |
| S6 | **Supabase SERVICE_ROLE_KEY still in `.env.local`** — This key bypasses all Supabase RLS policies. The migration is complete; this key is unused but still present and could be leaked. | `.env.local:17` | Remove all `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` entries. Rotate the key in the Supabase dashboard. |

---

## HIGH — Fix before production

| # | Issue | File(s) | Recommendation |
|---|-------|---------|----------------|
| S7 | **Unauthenticated payment list** — `GET /api/dinners/:id/payments` has no auth. Leaks user names, payment status, amounts, and fine details for any dinner. | `app/api/dinners/[id]/payments/route.ts:9` | Add `requireAuth()`. |
| S8 | **Unauthenticated bottle catalog** — `GET /api/bottles` has no auth. Full catalog with producer, vintage, and ratings is public. | `app/api/bottles/route.ts:7` | Add auth if this is a members-only app. |
| S9 | **Unauthenticated bottle ratings** — `GET /api/bottles/:id/ratings` leaks all user names, scores, and tasting notes without auth. | `app/api/bottles/[id]/ratings/route.ts:8` | Add `requireAuth()`. |
| S10 | **Unauthenticated dinner photos** — `GET /api/dinners/:id/photos` has no auth (POST does). | `app/api/dinners/[id]/photos/route.ts:8` | Add `requireAuth()` to GET handler. |
| S11 | **`requireFounder()` only checks `"admin"` role** — The function is named `requireFounder` but the implementation checks `auth.userRole !== "admin"`, silently excluding actual `"founder"` role users from admin-protected routes. | `lib/middleware.ts:58` | Fix check to `!["admin","founder"].includes(auth.userRole)` or clarify role hierarchy. |
| S12 | **Duplicate payment detection has no user check** — The uniqueness query uses only `dinner_id`, so the same user can have multiple payments created for the same dinner. | `app/api/dinners/[id]/payments/route.ts:143` | Add `.where(and(eq(payments.dinner_id, dinnerId), eq(payments.user_id, userId)))`. |
| S13 | **Auth token in `localStorage` (XSS risk)** — Tokens stored in localStorage are readable by any JavaScript running on the page. | `lib/auth-client.ts:13`, `app/login/page.tsx:33` | Migrate to `httpOnly` cookies. Until then, a strict Content-Security-Policy is essential. |
| S14 | **No HTTP security headers** — None of the following are set: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`. | `next.config.ts` | Add a `headers()` block in `next.config.ts` with these values. |
| S15 | **No CSRF protection** — All state-changing endpoints (`POST`, `PATCH`, `DELETE`) lack CSRF token validation. Combined with wildcard CORS (S4), this allows cross-site request forgery. | All mutation routes | Implement `SameSite=Strict` on the auth cookie (if S13 is fixed), or add CSRF tokens. |
| S16 | **Error responses leak internal details** — Every route catches errors and returns `{ error: "...", details: errorMessage }` where `errorMessage` is the raw exception message, exposing database error text, table names, and stack info. | All `route.ts` files | Log full error server-side only. Return a generic `"An unexpected error occurred"` message to the client. |
| S17 | **File upload extension from user-controlled filename** — `file.name.split(".").pop()` trusts the client-supplied filename. Double extensions (`malicious.sh.jpg`) pass the MIME check. | `app/api/upload/route.ts:41` | Derive the extension from the validated MIME type using a whitelist: `{ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }`. |
| S18 | **MIME type validation is client-controlled** — `file.type.startsWith("image/")` checks a value set by the browser/client. A malicious client can send any MIME string. | `app/api/upload/route.ts:37` | Validate magic bytes server-side using a library like `file-type` before uploading to R2. |

---

## MEDIUM — Address in next sprint

| # | Issue | File(s) | Recommendation |
|---|-------|---------|----------------|
| S19 | **No rate limiting on auth endpoints** — Login and register endpoints have no rate limiting; brute-force and credential stuffing attacks are trivial. | `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts` | Add IP-based rate limiting (Upstash Ratelimit + Vercel Edge, or `rate-limiter-flexible`). |
| S20 | **Password minimum is 6 characters** — Far below the 12-character industry standard. | `app/api/auth/register/route.ts:27` | Increase minimum to 12 characters. |
| S21 | **bcrypt salt rounds set to 10** — Acceptable but 12 is the current recommendation for resistance to GPU cracking. | `lib/auth.ts:13` | Change `genSalt(10)` → `genSalt(12)`. |
| S22 | **URL params not validated as UUIDs** — Dynamic route params (`[id]`, `[paymentId]`, `[fineId]`) are used directly in Drizzle queries without format validation. An invalid UUID causes an unhandled DB error. | All `[id]` route handlers | Add a UUID validation step: `if (!/^[0-9a-f-]{36}$/.test(id)) return 400`. |
| S23 | **Date validation regex accepts invalid dates** — `/^\d{4}-\d{2}-\d{2}$/` passes `9999-13-32`. | `app/api/dinners/route.ts:87` | Replace with `if (isNaN(new Date(event_date).getTime()))`. |
| S24 | **`JSON.parse` without try/catch in auth client** — `JSON.parse(userStr)` and `JSON.parse(atob(token.split(".")[1]))` will throw on corrupted localStorage, crashing the auth state. | `lib/auth-client.ts:30,41` | Wrap both in try/catch; on error, clear localStorage and return null. |
| S25 | **No input length limits on text fields** — `name`, `description`, `tasting_notes`, `reason` accept unbounded length. | `app/api/dinners/route.ts:80`, `app/api/dinners/[id]/bottles/route.ts:52`, `app/api/bottles/[id]/ratings/route.ts:63` | Add max-length validation (e.g. 200 chars for names, 2000 for notes) before DB insert. |
| S26 | **Authorization missing on fine operations** — No check that the payment or dinner belongs to an admin/organizer before creating/editing fines. | `app/api/dinners/[id]/payments/[paymentId]/fines/route.ts` | Verify `dinner.host_id === auth.userId` or `auth.userRole === "admin"` before mutating fines. |
| S27 | **Sensitive data logged to console** — User IDs, payment creation details logged with `console.log()` in API routes. | `app/api/dinners/[id]/bottles/route.ts:119,124,126` | Remove or replace with structured logging that redacts sensitive fields in production. |
| S28 | **No centralised input validation schema** — Each route validates inputs manually and inconsistently. | All routes | Adopt Zod for request body validation (`z.object({ ... }).parse(await req.json())`). |
| S29 | **Token expiry 7 days, no refresh** — Long-lived tokens increase the window of abuse if stolen. | `lib/auth.ts:30` | Reduce to 1–2 days and implement a refresh token or sliding session. |

---

## LOW — Polish

| # | Issue | File(s) |
|---|-------|---------|
| S30 | `maxFounders: 7` magic number hardcoded | `app/api/admin/users/route.ts:30` |
| S31 | No audit trail for admin operations (role changes, fine creation, payment updates) | `app/api/admin/`, payments routes |
| S32 | No pagination on list endpoints (`/api/bottles`, `/api/dinners`) — full table dumps | `app/api/bottles/route.ts`, `app/api/dinners/route.ts` |
| S33 | Stale test routes contain hardcoded user IDs | `app/api/test/route.ts` |
| S34 | `role` field accepted but silently ignored in register body — remove from destructuring to avoid confusion | `app/api/auth/register/route.ts:50` |
| S35 | No monitoring/alerting for repeated failed logins, unusual access patterns | — |

---

## INFO — Positive observations

- Drizzle ORM parameterizes all queries correctly — **no SQL injection risk**.
- `bcryptjs` properly used for password hashing and comparison.
- `JWT_SECRET` minimum length validated at startup via `lib/env.ts`.
- Email uniqueness enforced at the database level.
- File upload size capped at 5 MB.
- `requireAuth()` / `authenticate()` middleware is well-structured and reusable.
- `onDelete: "cascade"` used appropriately in schema foreign keys.

---

## Suggested Remediation Order

### Immediate (before any public access)
1. **S1** — Delete debug endpoint
2. **S2 / S3** — Auth + ownership check on `GET /PATCH /api/users/:id`
3. **S4** — Remove wildcard CORS or restrict to production domain
4. **S5** — Replace JWT secret placeholder with a real secret
5. **S6** — Remove Supabase keys from `.env.local`; rotate in dashboard

### Sprint 1
6. **S7–S10** — Add auth to payment, bottle, photo list endpoints
7. **S11** — Fix `requireFounder` role check
8. **S12** — Fix duplicate payment detection
9. **S14** — Add security headers in `next.config.ts`
10. **S16** — Strip error details from API responses

### Sprint 2
11. **S13** — Migrate auth token to `httpOnly` cookie
12. **S15** — CSRF protection (follows naturally from cookie-based auth)
13. **S17 / S18** — Harden file upload validation
14. **S19** — Rate limit auth endpoints
15. **S20 / S21** — Strengthen password and bcrypt settings

### Sprint 3
16. **S22–S29** — Input validation hardening (UUID checks, Zod, length limits, etc.)
