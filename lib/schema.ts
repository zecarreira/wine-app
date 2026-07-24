import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  date,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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
  is_completed: boolean("is_completed").notNull().default(false),
  reveal_index: integer("reveal_index").notNull().default(0),
  revealed_at: timestamp("revealed_at", { withTimezone: true }),
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
  position: integer("position"),
  dinner_id: uuid("dinner_id").references(() => dinners.id, { onDelete: "cascade" }),
  brought_by: uuid("brought_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bottle_id: uuid("bottle_id").references(() => bottles.id, { onDelete: "cascade" }),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    score: numeric("score", { precision: 3, scale: 1 }).notNull(), // 1.0 to 10.0 in 0.5 steps
    tasting_notes: text("tasting_notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique("ratings_bottle_user_unique").on(t.bottle_id, t.user_id)]
);

export const dinner_photos = pgTable("dinner_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  dinner_id: uuid("dinner_id").references(() => dinners.id, { onDelete: "cascade" }),
  photo_url: text("photo_url").notNull(),
  uploaded_by: uuid("uploaded_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dinner_id: uuid("dinner_id").references(() => dinners.id, { onDelete: "cascade" }),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    base_amount: integer("base_amount").notNull().default(10),
    status: text("status").notNull().default("pending"), // pending | paid
    paid_at: timestamp("paid_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique("payments_dinner_user_unique").on(t.dinner_id, t.user_id)]
);

export const fines = pgTable("fines", {
  id: uuid("id").primaryKey().defaultRandom(),
  payment_id: uuid("payment_id").references(() => payments.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Global defaults for dinner interval and deadline fine (admin-configurable). */
export const app_settings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  dinner_interval_months: integer("dinner_interval_months").notNull().default(6),
  deadline_fine_amount: integer("deadline_fine_amount").notNull().default(20),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  updated_by: uuid("updated_by").references(() => users.id),
});

/**
 * One active cycle at a time (partial unique).
 * Interval/fine are snapshots — admin settings changes do not retroact.
 * No pause_penalties column — derived at runtime (7 regular completed).
 */
export const deadline_cycles = pgTable(
  "deadline_cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    anchor_dinner_id: uuid("anchor_dinner_id").references(() => dinners.id),
    anchor_date: date("anchor_date").notNull(),
    interval_months: integer("interval_months").notNull(),
    fine_amount: integer("fine_amount").notNull(),
    deadline_at: date("deadline_at").notNull(),
    status: text("status").notNull().default("active"), // active | fulfilled | cancelled
    /** Admin-assigned next organizer; null = use alphabetic suggestion */
    responsible_organizer_id: uuid("responsible_organizer_id").references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("deadline_cycles_one_active")
      .on(t.status)
      .where(sql`status = 'active'`),
  ]
);

/** One row per (cycle, period_index). Reemit = edit row, not insert. */
export const deadline_penalties = pgTable(
  "deadline_penalties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycle_id: uuid("cycle_id")
      .notNull()
      .references(() => deadline_cycles.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    period_index: integer("period_index").notNull(),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("pending"), // pending | attached | waived
    period_deadline: date("period_deadline"),
    dinner_id: uuid("dinner_id").references(() => dinners.id),
    payment_id: uuid("payment_id").references(() => payments.id),
    fine_id: uuid("fine_id").references(() => fines.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    waived_by: uuid("waived_by").references(() => users.id),
    waived_at: timestamp("waived_at", { withTimezone: true }),
  },
  (t) => [unique("deadline_penalties_cycle_period_unique").on(t.cycle_id, t.period_index)]
);

/** Max one open poll (partial unique). */
export const availability_polls = pgTable(
  "availability_polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: text("status").notNull().default("open"), // open | closed | cancelled
    window_start: date("window_start").notNull(),
    window_end: date("window_end").notNull(),
    suggested_organizer_id: uuid("suggested_organizer_id").references(() => users.id),
    created_by: uuid("created_by").references(() => users.id),
    chosen_date: date("chosen_date"),
    created_dinner_id: uuid("created_dinner_id").references(() => dinners.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    closed_at: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("availability_polls_one_open")
      .on(t.status)
      .where(sql`status = 'open'`),
  ]
);

export const availability_responses = pgTable(
  "availability_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    poll_id: uuid("poll_id")
      .notNull()
      .references(() => availability_polls.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | submitted
    submitted_at: timestamp("submitted_at", { withTimezone: true }),
  },
  (t) => [unique("availability_responses_poll_user_unique").on(t.poll_id, t.user_id)]
);

export const availability_days = pgTable(
  "availability_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    response_id: uuid("response_id")
      .notNull()
      .references(() => availability_responses.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
  },
  (t) => [unique("availability_days_response_day_unique").on(t.response_id, t.day)]
);
