import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  unique,
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
