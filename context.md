# Project Context — Wine Rating App

Last updated: 2026-07-23

---

## Project Overview

A Next.js (App Router) wine tasting dinner app. Members attend blind tasting dinners, rate bottles anonymously, and see final rankings after the reveal. Includes payments/fines tracking and admin tools.

**Stack:**
- Next.js 16 (App Router, `"use client"` pages)
- React 19
- TypeScript
- Drizzle ORM + Neon PostgreSQL (`@neondatabase/serverless`)
- Cloudflare R2 for image storage (S3-compatible, `@aws-sdk/client-s3`)
- Tailwind CSS v4
- JWT auth (`lib/auth.ts`, `lib/middleware.ts`)
- React Query (`@tanstack/react-query`) for client-side data fetching

---

## Migration History

Fully migrated from Supabase → Neon + Drizzle + Cloudflare R2 (completed 2026-02-16).
- All API routes use Drizzle ORM (`lib/db.ts`, `lib/schema.ts`)
- Auth uses custom JWT (`lib/middleware.ts` → `requireAuth`)
- Image uploads go to Cloudflare R2; public URL via `R2_PUBLIC_URL`

---

## Key Files

| Path | Purpose |
|------|---------|
| `lib/db.ts` | Drizzle + Neon client |
| `lib/schema.ts` | Full DB schema (users, dinners, bottles, ratings, payments, fines) |
| `lib/middleware.ts` | `requireAuth()` — JWT verification for API routes |
| `lib/auth.ts` / `lib/auth-client.ts` | Token sign/verify + client helpers (`getUser()`, `getAuthToken()`) |
| `lib/hooks/useApi.ts` | React Query hooks (`useDinners`, `useDinner`, `useBottles`, etc.) |
| `app/api/` | All API routes (Next.js Route Handlers) |
| `components/` | Shared UI components |
| `docs/audit-2026-02-16.md` | Full code audit with 40 findings + implementation roadmap |

---

## Drizzle Gotchas

- `numeric` columns (e.g. `ratings.score`) come back as **strings** from Neon. Add `::float` cast in SQL or wrap with `Number()`.
  ```sql
  round(coalesce(avg(score), 0)::numeric, 1)::float
  ```
- `integer` columns (`fines.amount`, `payments.base_amount`) come back as JS numbers — no conversion needed.
- Multi-JOIN on same table requires `alias()` from `drizzle-orm/pg-core`:
  ```ts
  import { alias } from "drizzle-orm/pg-core";
  const broughtByUser = alias(users, "brought_by_user");
  ```
- Drizzle `.select().limit(1)` returns an array — destructure: `const [row] = await db.select()...limit(1);`

---

## Auth Pattern (API routes)

```ts
import { requireAuth } from "@/lib/middleware";

const auth = await requireAuth(request);
if (auth instanceof NextResponse) return auth; // 401 guard

// auth.userId, auth.role available
```

---

## Environment Variables (`.env.local`)

```
DATABASE_URL=          # Neon connection string
JWT_SECRET=            # Min 32 chars
R2_ENDPOINT=           # https://<accountId>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=        # bucket-wine
R2_PUBLIC_URL=         # https://pub-<hash>.r2.dev
```

---

## Current Git State

Branch: `main`

Uncommitted changes:
- `app/api/bottles/route.ts` — added `::float` cast to `average_rating`
- `app/dinners/[id]/rankings/page.tsx` — `data.rankings ?? []` null guard
- `app/profile/page.tsx` — clear stale session + redirect to `/login` on "User not found"
- `package-lock.json` — updated after dependency changes

Untracked:
- `docs/` — audit report (`audit-2026-02-16.md`) and this context file
- `.claude/` — skills + memory
- `.agents/` — agent output

---


### Schema (F3)
- Unique on ratings: `(bottle_id, user_id)` → `ratings_bottle_user_unique`
- Unique on payments: `(dinner_id, user_id)` → `payments_dinner_user_unique`
- Scripts: `db:generate`, `db:studio` (do not run generate against production casually)

## Pending Work — Audit Findings

Full audit: `docs/audit-2026-02-16.md`

### Phase 1 — Quick wins (< 1h each)
- [ ] #17 Fix `globals.css` body font override (remove `font-family` or use `var(--font-geist-sans)`)
- [ ] #27 Remove `suppressHydrationWarning` from `<body>` in `app/layout.tsx:30`
- [x] #37 Partial: `router.back()` in `app/stats/page.tsx` (check rankings/dinner pages if still needed)
- [x] #38 "Critérios de desempate:" already in rankings UI
- [x] #32 Login placeholder is `nome@exemplo.com`
- [ ] #6  Add `aria-label` + `p-2` padding to nav buttons in `components/Header.tsx` and `rankings/page.tsx:77–86`
- [ ] #4  Add `id`/`htmlFor` to `Input` component (`components/Input.tsx:14–27`)

### Phase 2 — High impact, moderate effort
- [ ] #1  `Promise.all` for parallel fetches in `app/dinners/[id]/page.tsx:106–154`
- [ ] #2  Push sort to DB with `ORDER BY` + pagination in `app/api/bottles/route.ts`
- [ ] #5  Replace `alert()` with `ToastProvider` in `app/profile/page.tsx:77,83,137`
- [ ] #7  Remove `forwardRef` from `Input` and `Textarea` (React 19 — `ref` is a plain prop)
- [ ] #22 Replace `useContext` with `use()` in `components/ToastProvider.tsx:121–127`
- [ ] #13 Add `sizes` to `<Image fill>` in `app/bottles/page.tsx:280,363`
- [ ] #18 Add `metadata` exports to all pages
- [ ] #12 Hoist `wineTypes` array + `Map` outside component in `app/bottles/page.tsx:37–40`
- [ ] #24 Fix `useMemo` → `useState` lazy init for localStorage in `app/dinners/page.tsx:44–47`
- [ ] #3  Replace barrel imports with direct imports in `app/bottles/page.tsx:6`, `app/dinners/[id]/page.tsx:6`

### Phase 3 — Architectural refactors
- [x] #8 PaymentsSection split into hook + subcomponents (Header still pending)
- [ ] #19  Extract `ProfileProvider` + subcomponents from `ProfilePage` (470-line monolith)
- [x] #20 Extract `<BottleCard variant="grid|list">`
- [x] #21 Extract `usePayments()` + FineModal / PaymentCard / PaymentStatsStrip
- [ ] #10  Add `GET /api/dinners/[id]` endpoint; fix `useDinner` hook (currently fetches all dinners and filters client-side)
- [ ] #14  Use `queryClient.invalidateQueries` instead of manual `fetchData()` after mutations

---

## Known Issues / Notes

- `useDinner(id)` in `lib/hooks/useApi.ts:39–52` fetches **all** dinners and filters client-side — performance issue at scale.
- `app/profile/page.tsx` is a 470-line monolith — candidates for extraction: `ProfileHeader`, `RecentRatings`, `BottlesBrought`.
- Index used as `key` for ratings in `rankings/page.tsx:155` — unstable on reorder; the `Rating` interface needs an `id` field.
- `window.history.back()` used in 2 places instead of `router.back()`.
- Portuguese UI but "Tiebreaker rules:" label still in English.
