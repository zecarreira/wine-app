# Migrate Supabase → Neon + R2 + Drizzle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Supabase (database + storage) with Neon (PostgreSQL via Drizzle ORM) + Cloudflare R2 (file storage), eliminating the 7-day free tier pause problem.

**Architecture:** All database queries currently done via `@supabase/supabase-js` client will be replaced by Drizzle ORM queries against Neon's PostgreSQL. File uploads currently going to Supabase Storage buckets will be replaced by Cloudflare R2 via the AWS S3-compatible SDK. Custom JWT auth remains completely unchanged.

**Tech Stack:**
- `drizzle-orm` + `drizzle-kit` — type-safe ORM + migrations
- `@neondatabase/serverless` — Neon's serverless PostgreSQL driver (optimized for edge/Next.js)
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — R2 uploads (S3-compatible API)

---

## Context: Current State

- `lib/db.ts` — exports `supabase` and `supabaseAdmin` Supabase clients
- `lib/env.ts` — validates Supabase env vars on boot
- `app/api/upload/route.ts` — uploads to Supabase Storage buckets
- ALL 42 API routes use `supabase.from('table').select(...)` pattern
- `next.config.ts` — has Supabase CDN in image `remotePatterns`
- `.env.example` already documents the target: `DATABASE_URL` + R2 vars
- No Prisma, no existing ORM — raw Supabase client queries only
- RLS policies exist in Supabase but are irrelevant after migration (app uses custom JWT auth via `lib/middleware.ts`)

## What Does NOT Change

- `lib/auth.ts` — JWT creation/verification (untouched)
- `lib/auth-client.ts` — client-side token storage (untouched)
- `lib/middleware.ts` — `authenticate()`, `requireAuth()`, `requireFounder()` (untouched)
- All pages, components, hooks in `/app`, `/components`, `/lib/hooks` (untouched)
- All business logic within API routes (only the DB query syntax changes)

---

## Database Schema (8 tables to define in Drizzle)

Inferred from migrations and API routes:

```
users          — id, name, email, password_hash, role, profile_photo_url, created_at, updated_at
seasons        — id, season_number, status, start_date, end_date, created_at, updated_at
dinners        — id, name, event_date, location, status, season_id, created_by, organizer_id, host_id, is_blind, is_extra_dinner, dinner_number_in_season, started_at, ended_at, created_at, updated_at
bottles        — id, name, producer, vintage, wine_type, description, photo_url, dinner_id, brought_by, created_at, updated_at
ratings        — id, bottle_id, user_id, score, tasting_notes, created_at, updated_at
dinner_photos  — id, dinner_id, photo_url, uploaded_by, created_at
payments       — id, dinner_id, user_id, base_amount, status, paid_at, created_at, updated_at
fines          — id, payment_id, amount, reason, created_by, created_at, updated_at
```

Plus the `season_stats` view (used in `/api/seasons`).

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Drizzle + Neon driver**

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

**Step 2: Install R2/S3 SDK**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Step 3: Verify installs**

```bash
npm ls drizzle-orm @neondatabase/serverless @aws-sdk/client-s3
```
Expected: all three listed with version numbers, no errors.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add drizzle-orm, neon serverless driver, aws-sdk/s3 for R2"
```

---

## Task 2: Update environment variables

**Files:**
- Modify: `.env.local`
- Modify: `.env.example`
- Modify: `lib/env.ts`

**Step 1: Add to `.env.local`**

Add these lines (keep existing Supabase vars for now — remove at the very end):
```
DATABASE_URL=postgresql://neondb_owner:<password>@ep-sweet-dream-abgetd24-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret>
R2_BUCKET_NAME=wine-rating-app
R2_PUBLIC_URL=https://<your-r2-public-url>
```

> Note: The `DATABASE_URL` for Neon is already in `.env.local` from a prior setup attempt. Check if it's there first.

**Step 2: Update `lib/env.ts`**

Replace the entire file content:

```typescript
interface EnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
  R2_ENDPOINT: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
}

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
};

export function validateEnv(): EnvVars {
  const missing: string[] = [];

  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) missing.push(key);
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join("\n")}\n\nSee .env.example for reference.`
    );
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }

  return requiredEnvVars as EnvVars;
}

export const env = validateEnv();
```

**Step 3: Update `.env.example`**

Replace with:
```
# Database (Neon.tech PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Secret (minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars

# Cloudflare R2 Storage
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=wine-rating-app
R2_PUBLIC_URL=https://your-public-bucket-url.example.com
```

**Step 4: Commit**

```bash
git add lib/env.ts .env.example
git commit -m "config: update env vars — replace Supabase with Neon + R2"
```

---

## Task 3: Create Drizzle schema

**Files:**
- Create: `lib/schema.ts`
- Create: `drizzle.config.ts`

**Step 1: Create `lib/schema.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  uniqueIndex,
  index,
  pgView,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash"),
  role: text("role").notNull().default("guest"), // admin | founder | guest
  profile_photo_url: text("profile_photo_url"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  season_number: integer("season_number").notNull(),
  status: text("status").notNull().default("active"), // active | completed
  start_date: timestamp("start_date", { withTimezone: true }),
  end_date: timestamp("end_date", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const dinners = pgTable("dinners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  event_date: text("event_date").notNull(), // YYYY-MM-DD string
  location: text("location"),
  status: text("status").notNull().default("setup"), // setup | active | ended | revealing | completed
  season_id: uuid("season_id").references(() => seasons.id, { onDelete: "cascade" }),
  created_by: uuid("created_by").references(() => users.id),
  organizer_id: uuid("organizer_id").references(() => users.id),
  host_id: uuid("host_id").references(() => users.id),
  is_blind: boolean("is_blind").notNull().default(false),
  is_extra_dinner: boolean("is_extra_dinner").notNull().default(false),
  dinner_number_in_season: integer("dinner_number_in_season"),
  started_at: timestamp("started_at", { withTimezone: true }),
  ended_at: timestamp("ended_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const bottles = pgTable("bottles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  producer: text("producer"),
  vintage: integer("vintage"),
  wine_type: text("wine_type").notNull().default("red"), // red | white | rosé | sparkling | dessert | other
  description: text("description"),
  photo_url: text("photo_url"),
  dinner_id: uuid("dinner_id").references(() => dinners.id, { onDelete: "cascade" }),
  brought_by: uuid("brought_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bottle_id: uuid("bottle_id").references(() => bottles.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 3, scale: 1 }).notNull(), // 1.0 to 10.0 in 0.5 steps
  tasting_notes: text("tasting_notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const dinner_photos = pgTable("dinner_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  dinner_id: uuid("dinner_id").references(() => dinners.id, { onDelete: "cascade" }),
  photo_url: text("photo_url").notNull(),
  uploaded_by: uuid("uploaded_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  dinner_id: uuid("dinner_id").references(() => dinners.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  base_amount: integer("base_amount").notNull().default(10),
  status: text("status").notNull().default("pending"), // pending | paid
  paid_at: timestamp("paid_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const fines = pgTable("fines", {
  id: uuid("id").primaryKey().defaultRandom(),
  payment_id: uuid("payment_id").references(() => payments.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

**Step 2: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 3: Commit**

```bash
git add lib/schema.ts drizzle.config.ts
git commit -m "feat: add drizzle schema for all 8 tables"
```

---

## Task 4: Create Drizzle DB client

**Files:**
- Modify: `lib/db.ts`

**Step 1: Replace `lib/db.ts` entirely**

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export default db;
```

> **Why `neon-http` and not `neon-serverless`?** The HTTP driver is optimal for Next.js API routes (serverless functions) — it doesn't hold open a WebSocket connection. Use `neon-websocket` only if you need transactions spanning multiple queries.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors (or only errors in API routes that still reference `supabase` — those will be fixed in Tasks 5-11).

**Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: replace supabase client with drizzle+neon db client"
```

---

## Task 5: Create season_stats view helper

**Context:** `/api/seasons` queries the `season_stats` view that doesn't exist in Drizzle schema. We need to either replicate it as a SQL view on Neon or write the equivalent query inline.

**Files:**
- Create: `lib/queries/seasons.ts`

**Step 1: Create `lib/queries/seasons.ts`**

This replicates the `season_stats` view as a reusable Drizzle query:

```typescript
import { db } from "@/lib/db";
import { seasons, dinners } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function getSeasonStats() {
  // Replaces: supabase.from("season_stats").select("*")
  const result = await db
    .select({
      id: seasons.id,
      season_number: seasons.season_number,
      status: seasons.status,
      start_date: seasons.start_date,
      end_date: seasons.end_date,
      created_at: seasons.created_at,
      dinner_count: sql<number>`count(${dinners.id})::int`,
    })
    .from(seasons)
    .leftJoin(dinners, eq(dinners.season_id, seasons.id))
    .groupBy(seasons.id)
    .orderBy(desc(seasons.season_number));

  return result;
}
```

**Step 2: Commit**

```bash
git add lib/queries/seasons.ts
git commit -m "feat: add season stats query helper (replaces season_stats view)"
```

---

## Task 6: Migrate Auth API routes

**Files:**
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/auth/register/route.ts`

**Step 1: Update `app/api/auth/login/route.ts`**

Replace `supabase.from("users").select("*").eq("email", email).single()` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { comparePassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "This account does not have a password set" },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = createToken(user.id, user.role);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Login failed", details: errorMessage }, { status: 500 });
  }
}
```

**Step 2: Update `app/api/auth/register/route.ts`**

Pattern: replace `supabase.from("users").insert({...}).select().single()` with:

```typescript
const [newUser] = await db
  .insert(users)
  .values({
    name,
    email,
    password_hash: hashedPassword,
    role: "guest",
  })
  .returning();
```

**Step 3: Test locally**

```bash
npm run dev
# Test: POST http://localhost:3000/api/auth/login with valid credentials
# Expected: { success: true, token: "..." }
```

**Step 4: Commit**

```bash
git add app/api/auth/
git commit -m "feat: migrate auth routes to drizzle+neon"
```

---

## Task 7: Migrate Seasons API routes

**Files:**
- Modify: `app/api/seasons/route.ts`
- Modify: `app/api/seasons/active/route.ts`
- Modify: `app/api/seasons/active/available-organizers/route.ts`
- Modify: `app/api/seasons/[id]/route.ts`
- Modify: `app/api/seasons/[id]/close/route.ts`
- Modify: `app/api/seasons/[id]/stats/route.ts`
- Modify: `app/api/stats/all-seasons/route.ts`

**Key Drizzle patterns to use:**

```typescript
import { db } from "@/lib/db";
import { seasons, dinners, users } from "@/lib/schema";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import { getSeasonStats } from "@/lib/queries/seasons";

// Instead of: supabase.from("season_stats").select("*").order(...)
const seasonStats = await getSeasonStats();

// Instead of: supabase.from("seasons").select("*").eq("status", "active").single()
const [activeSeason] = await db
  .select()
  .from(seasons)
  .where(eq(seasons.status, "active"))
  .limit(1);

// Instead of: supabase.from("seasons").select("season_number").order(...).limit(1).single()
const [lastSeason] = await db
  .select({ season_number: seasons.season_number })
  .from(seasons)
  .orderBy(desc(seasons.season_number))
  .limit(1);

// Instead of: supabase.from("seasons").insert({...}).select().single()
const [newSeason] = await db.insert(seasons).values({ season_number, status: "active" }).returning();

// Instead of: supabase.from("seasons").update({...}).eq("id", id).select().single()
const [updated] = await db
  .update(seasons)
  .set({ status: "completed", end_date: new Date() })
  .where(eq(seasons.id, id))
  .returning();
```

**Step 1: Update each season route file using the patterns above**

**Step 2: Test**

```bash
# GET /api/seasons — should return list with dinner_count
# GET /api/seasons/active — should return current active season
# POST /api/seasons — create new season (as admin/founder)
```

**Step 3: Commit**

```bash
git add app/api/seasons/ app/api/stats/
git commit -m "feat: migrate seasons routes to drizzle+neon"
```

---

## Task 8: Migrate Dinners API routes

**Files:**
- Modify: `app/api/dinners/route.ts`
- Modify: `app/api/dinners/[id]/route.ts`
- Modify: `app/api/dinners/[id]/start/route.ts`
- Modify: `app/api/dinners/[id]/end/route.ts`
- Modify: `app/api/dinners/[id]/ratings/route.ts`
- Modify: `app/api/dinners/[id]/reveal-status/route.ts`
- Modify: `app/api/dinners/[id]/reveal-next/route.ts`
- Modify: `app/api/dinners/[id]/debug/route.ts` (if exists)
- Modify: `app/api/dinners/[id]/photos/route.ts`

**Key Drizzle patterns:**

```typescript
// JOIN pattern (replaces supabase nested selects like users!created_by)
import { alias } from "drizzle-orm/pg-core";

const createdByUser = alias(users, "created_by_user");
const organizer = alias(users, "organizer");

const result = await db
  .select({
    ...getTableColumns(dinners),
    created_by_user: { id: createdByUser.id, name: createdByUser.name, email: createdByUser.email },
    organizer: { id: organizer.id, name: organizer.name },
    season: { id: seasons.id, season_number: seasons.season_number, status: seasons.status },
  })
  .from(dinners)
  .leftJoin(createdByUser, eq(dinners.created_by, createdByUser.id))
  .leftJoin(organizer, eq(dinners.organizer_id, organizer.id))
  .leftJoin(seasons, eq(dinners.season_id, seasons.id))
  .orderBy(desc(dinners.event_date));

// COUNT pattern (replaces { count: "exact", head: true })
const [{ value: dinnerCount }] = await db
  .select({ value: count() })
  .from(dinners)
  .where(eq(dinners.season_id, activeSeason.id));

// maybeSingle equivalent (no .single() that throws)
const [existing] = await db
  .select({ id: dinners.id })
  .from(dinners)
  .where(and(eq(dinners.season_id, seasonId), eq(dinners.organizer_id, organizerId)))
  .limit(1);
// existing is undefined if not found — no exception thrown
```

> **Important note on `getTableColumns`:** Import from `drizzle-orm` — it extracts all columns from a table object, useful when you need `...getTableColumns(dinners)` alongside joined fields.

**Step 1: Update each dinner route file**

**Step 2: Test critical paths**

```bash
# GET /api/dinners — list dinners
# GET /api/dinners?onlyActive=true — only active season
# POST /api/dinners — create dinner
# POST /api/dinners/:id/start — start blind tasting
# POST /api/dinners/:id/end — end dinner
# GET /api/dinners/:id/reveal-status — reveal progress
# POST /api/dinners/:id/reveal-next — reveal next bottle
```

**Step 3: Commit**

```bash
git add app/api/dinners/
git commit -m "feat: migrate dinners routes to drizzle+neon"
```

---

## Task 9: Migrate Bottles API routes

**Files:**
- Modify: `app/api/bottles/route.ts`
- Modify: `app/api/bottles/[id]/route.ts`
- Modify: `app/api/bottles/[id]/ratings/route.ts`
- Modify: `app/api/dinners/[id]/bottles/route.ts`

**Key pattern — bottles with avg rating (replaces inline `supabase.from("bottles").select(...)` with nested ratings):**

```typescript
import { avg, sql } from "drizzle-orm";

// Fetch bottles with aggregated rating data
const bottlesWithRatings = await db
  .select({
    ...getTableColumns(bottles),
    brought_by_user: { id: users.id, name: users.name },
    dinner: { id: dinners.id, name: dinners.name, event_date: dinners.event_date },
    total_ratings: sql<number>`count(${ratings.id})::int`,
    average_rating: sql<number>`round(avg(${ratings.score})::numeric, 1)`,
  })
  .from(bottles)
  .leftJoin(users, eq(bottles.brought_by, users.id))
  .leftJoin(dinners, eq(bottles.dinner_id, dinners.id))
  .leftJoin(ratings, eq(ratings.bottle_id, bottles.id))
  .groupBy(bottles.id, users.id, dinners.id)
  .orderBy(asc(bottles.name));
```

Note: The JS-side sorting and producer list building logic in `app/api/bottles/route.ts` stays as-is — only replace the DB query part.

**Step 1: Update each bottles route**

**Step 2: Test**

```bash
# GET /api/bottles — catalog with filters
# GET /api/bottles/:id — bottle detail
# POST /api/dinners/:id/bottles — add bottle to dinner
```

**Step 3: Commit**

```bash
git add app/api/bottles/ app/api/dinners/
git commit -m "feat: migrate bottles routes to drizzle+neon"
```

---

## Task 10: Migrate Users & Admin API routes

**Files:**
- Modify: `app/api/users/[id]/route.ts`
- Modify: `app/api/admin/users/route.ts`
- Modify: `app/api/admin/users/[id]/route.ts`

**Pattern:**

```typescript
// Get user by id
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

// Update user role
const [updatedUser] = await db
  .update(users)
  .set({ role: newRole, updated_at: new Date() })
  .where(eq(users.id, id))
  .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

// List all users
const allUsers = await db
  .select({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at })
  .from(users)
  .orderBy(asc(users.name));
```

**Step 1: Update all 3 admin/user routes**

**Step 2: Test**

```bash
# GET /api/users/:id
# GET /api/admin/users (as admin)
# PATCH /api/admin/users/:id — change role
```

**Step 3: Commit**

```bash
git add app/api/users/ app/api/admin/
git commit -m "feat: migrate users and admin routes to drizzle+neon"
```

---

## Task 11: Migrate Payments & Fines API routes

**Files:**
- Modify: `app/api/dinners/[id]/payments/route.ts`
- Modify: `app/api/dinners/[id]/payments/[paymentId]/route.ts`
- Modify: `app/api/dinners/[id]/payments/[paymentId]/fines/route.ts`
- Modify: `app/api/dinners/[id]/payments/[paymentId]/fines/[fineId]/route.ts`

**Key patterns:**

```typescript
// payments with fines aggregated
const paymentsWithFines = await db
  .select({
    ...getTableColumns(payments),
    user: { id: users.id, name: users.name },
    fines_total: sql<number>`coalesce(sum(${fines.amount}), 0)::int`,
    fines: sql<any[]>`json_agg(json_build_object('id', ${fines.id}, 'amount', ${fines.amount}, 'reason', ${fines.reason}) ORDER BY ${fines.created_at}) FILTER (WHERE ${fines.id} IS NOT NULL)`,
  })
  .from(payments)
  .leftJoin(users, eq(payments.user_id, users.id))
  .leftJoin(fines, eq(fines.payment_id, payments.id))
  .where(eq(payments.dinner_id, dinnerId))
  .groupBy(payments.id, users.id);

// Mark payment as paid
const [updated] = await db
  .update(payments)
  .set({ status: "paid", paid_at: new Date(), updated_at: new Date() })
  .where(eq(payments.id, paymentId))
  .returning();

// Add fine
const [newFine] = await db
  .insert(fines)
  .values({ payment_id: paymentId, amount, reason, created_by: auth.userId })
  .returning();

// Delete fine
await db.delete(fines).where(eq(fines.id, fineId));
```

**Step 1: Update all payment and fine routes**

**Step 2: Test**

```bash
# GET /api/dinners/:id/payments
# POST /api/dinners/:id/payments (as admin)
# PATCH /api/dinners/:id/payments/:paymentId
# POST /api/dinners/:id/payments/:paymentId/fines
# DELETE /api/dinners/:id/payments/:paymentId/fines/:fineId
```

**Step 3: Commit**

```bash
git add app/api/dinners/
git commit -m "feat: migrate payments and fines routes to drizzle+neon"
```

---

## Task 12: Migrate file upload to Cloudflare R2

**Files:**
- Modify: `app/api/upload/route.ts`

**Step 1: Replace `app/api/upload/route.ts` entirely**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_FOLDERS = ["bottle-photos", "dinner-photos", "profile-photos"];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("bucket") as string; // kept param name as "bucket" for frontend compatibility

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!folder || !ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ success: false, error: "Invalid folder" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only images allowed" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${userId}-${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileName,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({ success: true, url: publicUrl, path: fileName });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload" },
      { status: 500 }
    );
  }
}
```

> **Note on `bucket` param name:** The frontend calls this with `formData.append("bucket", "bottle-photos")`. Keep the param name as `"bucket"` to avoid touching frontend code.

**Step 2: Update `next.config.ts` image remotePatterns**

Find and replace the Supabase CDN hostname with the R2 public URL hostname:

```typescript
// Remove:
{ protocol: "https", hostname: "gecbnplqjgfhjjqxbuww.supabase.co" }

// Add (replace with actual R2 public URL domain):
{ protocol: "https", hostname: "<your-r2-public-subdomain>.r2.dev" }
// OR if using custom domain:
{ protocol: "https", hostname: "your-custom-domain.example.com" }
```

**Step 3: Test upload**

```bash
# POST /api/upload with a small image file + Authorization header
# Expected: { success: true, url: "https://<r2-public-url>/bottle-photos/userId-timestamp.jpg" }
```

**Step 4: Commit**

```bash
git add app/api/upload/route.ts next.config.ts
git commit -m "feat: migrate file upload from Supabase Storage to Cloudflare R2"
```

---

## Task 13: Remove Supabase dependencies

**Files:**
- Modify: `package.json`
- Delete: any remaining Supabase imports

**Step 1: Check for remaining Supabase references**

```bash
grep -r "supabase\|@supabase" app/ lib/ --include="*.ts" --include="*.tsx" -l
```
Expected: no files listed (all should have been replaced in Tasks 6-12).

**Step 2: Remove Supabase packages**

```bash
npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Step 3: Remove Supabase vars from `.env.local`**

Delete these lines from `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Step 4: Build check**

```bash
npm run build
```
Expected: Build succeeds with no TypeScript errors and no missing module errors.

**Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: remove supabase dependencies — migration to neon+r2 complete"
```

---

## Task 14: Final verification & deploy

**Step 1: Full local test run**

```bash
npm run dev
```

Test these flows manually:
- [ ] Login / Register
- [ ] List dinners
- [ ] Create dinner (as founder/admin)
- [ ] Add bottle to dinner
- [ ] Upload bottle photo
- [ ] Submit ratings
- [ ] Reveal ceremony (reveal-status + reveal-next)
- [ ] Season stats
- [ ] Payments list
- [ ] Add fine / delete fine
- [ ] Admin user management

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 3: Update Vercel environment variables**

In Vercel dashboard → Project Settings → Environment Variables:
- Remove: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Add: `DATABASE_URL`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

**Step 4: Deploy**

```bash
git push origin main
```

**Step 5: Smoke test production**

- [ ] Login works
- [ ] Photos load (from R2 URL)
- [ ] New photo upload works

---

## Troubleshooting Reference

### "Cannot find module 'drizzle-orm/neon-http'"
→ Run `npm install` again. Check `node_modules/drizzle-orm/` exists.

### "NeonDbError: relation does not exist"
→ The Neon DB may not have the tables yet. The existing Neon DB URL from `.env.local` may point to an empty database. Run the existing migrations SQL against it:
```bash
# Connect to Neon and run all SQL in migrations/ folder
psql $DATABASE_URL -f migrations/create_payments_system.sql
# etc.
```
OR use `drizzle-kit push` to sync schema directly:
```bash
npx drizzle-kit push
```
> **Warning:** `drizzle-kit push` is for development only — it modifies the DB to match your schema directly without a migration file.

### "R2 upload: 403 Forbidden"
→ Check R2 bucket CORS settings. In Cloudflare dashboard → R2 → bucket → Settings → CORS, add:
```json
[{ "AllowedOrigins": ["*"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"] }]
```
Also verify the R2 API token has `Object Read & Write` permission.

### "Images not loading after migration"
→ Old photo URLs in the DB still point to Supabase CDN. New uploads will use R2. For existing photos: either leave them on Supabase (it still works until you close the project) or run a migration script to copy them to R2 and update the URLs in the DB.

### Drizzle JOIN with multiple aliases of the same table
→ Use `alias()` from `drizzle-orm/pg-core`:
```typescript
import { alias } from "drizzle-orm/pg-core";
const organizer = alias(users, "organizer");
const host = alias(users, "host");
```

---

## Summary

| Task | Description | Risk |
|------|-------------|------|
| 1 | Install deps | Low |
| 2 | Update env vars | Low |
| 3 | Create Drizzle schema | Medium — must match existing DB exactly |
| 4 | Replace db.ts client | Low |
| 5 | Season stats helper | Low |
| 6 | Auth routes | Low |
| 7 | Seasons routes | Medium |
| 8 | Dinners routes | High — most complex queries |
| 9 | Bottles routes | Medium |
| 10 | Users/Admin routes | Low |
| 11 | Payments routes | Medium |
| 12 | Upload → R2 | Low — R2 config already exists |
| 13 | Remove Supabase | Low (after all above done) |
| 14 | Deploy | Low |

**Estimated sessions:** 3-4 focused sessions of work
**Biggest risk:** Task 8 (Dinners) and Task 3 (Schema) — dinners have the most complex queries (JOINs, reveal logic) and the schema must match the live DB exactly to avoid data loss.
