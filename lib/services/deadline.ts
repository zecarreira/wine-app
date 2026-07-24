import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  app_settings,
  deadline_cycles,
  deadline_penalties,
  dinners,
  fines,
  payments,
  seasons,
  users,
} from "@/lib/schema";
import {
  computeDeadline,
  computeUrgency,
  daysBetween,
  DEFAULT_DEADLINE_FINE,
  DEFAULT_DINNER_INTERVAL_MONTHS,
  DEADLINE_WARNING_DAYS,
  periodDeadlineDate,
  periodsDue,
  requireDateString,
  shouldPausePenalties,
  todayLisbon,
  type DeadlineUrgency,
} from "@/lib/domain";

export type AppSettings = typeof app_settings.$inferSelect;
export type DeadlineCycle = typeof deadline_cycles.$inferSelect;
export type DeadlinePenalty = typeof deadline_penalties.$inferSelect;

export async function getOrCreateSettings(): Promise<AppSettings> {
  const existing = await db.select().from(app_settings).limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(app_settings)
    .values({
      dinner_interval_months: DEFAULT_DINNER_INTERVAL_MONTHS,
      deadline_fine_amount: DEFAULT_DEADLINE_FINE,
    })
    .returning();
  return created;
}

export async function updateSettings(input: {
  dinner_interval_months?: number;
  deadline_fine_amount?: number;
  updated_by: string;
}): Promise<AppSettings> {
  const current = await getOrCreateSettings();
  const [updated] = await db
    .update(app_settings)
    .set({
      dinner_interval_months:
        input.dinner_interval_months ?? current.dinner_interval_months,
      deadline_fine_amount:
        input.deadline_fine_amount ?? current.deadline_fine_amount,
      updated_at: new Date(),
      updated_by: input.updated_by,
    })
    .where(eq(app_settings.id, current.id))
    .returning();
  return updated;
}

export async function getActiveCycle(): Promise<DeadlineCycle | null> {
  const [cycle] = await db
    .select()
    .from(deadline_cycles)
    .where(eq(deadline_cycles.status, "active"))
    .limit(1);
  return cycle ?? null;
}

/**
 * Last realized dinner: is_completed = true, ordered by event_date then ended_at.
 * Used as anchor for deadline cycles (including backfill for dinners completed
 * before this feature existed).
 */
export async function getLastRealizedDinner(): Promise<{
  id: string;
  event_date: string;
  is_completed: boolean | null;
  name: string;
} | null> {
  const [row] = await db
    .select({
      id: dinners.id,
      event_date: dinners.event_date,
      is_completed: dinners.is_completed,
      name: dinners.name,
    })
    .from(dinners)
    .where(eq(dinners.is_completed, true))
    .orderBy(desc(dinners.event_date), desc(dinners.ended_at))
    .limit(1);
  return row ?? null;
}

/** Open active cycle from a realized dinner (snapshot settings). */
async function openCycleFromDinner(dinner: {
  id: string;
  event_date: string;
}): Promise<DeadlineCycle> {
  const settings = await getOrCreateSettings();
  const anchorDate = requireDateString(dinner.event_date, "event_date");
  const interval = settings.dinner_interval_months;
  const fineAmount = settings.deadline_fine_amount;
  const deadlineAt = computeDeadline(anchorDate, interval);

  // Lazy default: alphabetic next organizer; admin can reassign on /calendar
  const available = await getAvailableOrganizers();
  const defaultOrg = available[0]?.id ?? null;

  const [created] = await db
    .insert(deadline_cycles)
    .values({
      anchor_dinner_id: dinner.id,
      anchor_date: anchorDate,
      interval_months: interval,
      fine_amount: fineAmount,
      deadline_at: deadlineAt,
      status: "active",
      responsible_organizer_id: defaultOrg,
    })
    .returning();
  return created;
}

/** Founders/admins not yet organizers in active season, name ASC. */
export async function getAvailableOrganizers(): Promise<
  { id: string; name: string; email: string }[]
> {
  const [activeSeason] = await db
    .select({ id: seasons.id })
    .from(seasons)
    .where(eq(seasons.status, "active"))
    .limit(1);

  if (!activeSeason) return [];

  const founders = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, ["founder", "admin"]))
    .orderBy(asc(users.name));

  const organizerRows = await db
    .select({ organizer_id: dinners.organizer_id })
    .from(dinners)
    .where(eq(dinners.season_id, activeSeason.id));

  const used = new Set(
    organizerRows.map((r) => r.organizer_id).filter((id): id is string => !!id)
  );

  return founders.filter((f) => !used.has(f.id));
}

export async function getCurrentOrganizerSuggestion(): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  const available = await getAvailableOrganizers();
  return available[0] ?? null;
}

/** All founder+admin for admin picker. */
export async function getAllOrganizerOptions(): Promise<
  { id: string; name: string; email: string; role: string }[]
> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(inArray(users.role, ["founder", "admin"]))
    .orderBy(asc(users.name));
}

/** Assigned organizer or alphabetic suggestion. */
export async function getResponsibleOrganizer(
  cycle: DeadlineCycle
): Promise<{
  id: string;
  name: string;
  email?: string;
  source: "assigned" | "suggestion";
} | null> {
  if (cycle.responsible_organizer_id) {
    const [u] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, cycle.responsible_organizer_id))
      .limit(1);
    if (u) return { ...u, source: "assigned" as const };
  }
  const suggestion = await getCurrentOrganizerSuggestion();
  if (!suggestion) return null;
  return {
    id: suggestion.id,
    name: suggestion.name,
    email: suggestion.email,
    source: "suggestion" as const,
  };
}

export async function setResponsibleOrganizer(
  organizerId: string | null
): Promise<DeadlineCycle> {
  const cycle = await getActiveCycle();
  if (!cycle) throw new Error("Sem ciclo de prazo activo");

  if (organizerId) {
    const [u] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, organizerId))
      .limit(1);
    if (!u || (u.role !== "founder" && u.role !== "admin")) {
      throw new Error("Organizador inválido (tem de ser founder ou admin)");
    }
  }

  const [updated] = await db
    .update(deadline_cycles)
    .set({
      responsible_organizer_id: organizerId,
      updated_at: new Date(),
    })
    .where(eq(deadline_cycles.id, cycle.id))
    .returning();
  return updated;
}

async function countRegularCompletedInActiveSeason(): Promise<number> {
  const [activeSeason] = await db
    .select({ id: seasons.id })
    .from(seasons)
    .where(eq(seasons.status, "active"))
    .limit(1);

  if (!activeSeason) return 0;

  const [row] = await db
    .select({ n: count() })
    .from(dinners)
    .where(
      and(
        eq(dinners.season_id, activeSeason.id),
        eq(dinners.is_extra_dinner, false),
        eq(dinners.is_completed, true)
      )
    );

  return Number(row?.n ?? 0);
}

/**
 * Lazy-generate missing deadline penalties for the active cycle.
 * Skips creation when shouldPausePenalties (7 regular completed).
 */
export async function ensureDeadlineState(today: string = todayLisbon()): Promise<{
  cycle: DeadlineCycle | null;
  pausePenalties: boolean;
  created: number;
}> {
  let cycle = await getActiveCycle();

  // Backfill: dinners realized before this feature never opened a cycle.
  if (!cycle) {
    const last = await getLastRealizedDinner();
    if (last) {
      try {
        cycle = await openCycleFromDinner(last);
      } catch (err) {
        // race: another request created the active cycle
        console.warn("ensureDeadlineState backfill race:", err);
        cycle = await getActiveCycle();
      }
    }
  }

  if (!cycle) {
    return { cycle: null, pausePenalties: false, created: 0 };
  }

  const regularCompletedCount = await countRegularCompletedInActiveSeason();
  const pause = shouldPausePenalties({ regularCompletedCount });

  if (pause) {
    return { cycle, pausePenalties: true, created: 0 };
  }

  const deadlineAt = requireDateString(cycle.deadline_at, "deadline_at");
  const due = periodsDue(deadlineAt, cycle.interval_months, today);
  if (due.length === 0) {
    return { cycle, pausePenalties: false, created: 0 };
  }

  const existing = await db
    .select({ period_index: deadline_penalties.period_index })
    .from(deadline_penalties)
    .where(eq(deadline_penalties.cycle_id, cycle.id));

  const have = new Set(existing.map((e) => e.period_index));
  const missing = due.filter((k) => !have.has(k));
  if (missing.length === 0) {
    return { cycle, pausePenalties: false, created: 0 };
  }

  const responsible = await getResponsibleOrganizer(cycle);
  let userId = responsible?.id ?? null;
  if (!userId) {
    const [fallback] = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["founder", "admin"]))
      .orderBy(asc(users.name))
      .limit(1);
    userId = fallback?.id ?? null;
  }
  if (!userId) {
    console.warn("ensureDeadlineState: no user to assign penalty");
    return { cycle, pausePenalties: false, created: 0 };
  }

  let created = 0;
  for (const periodIndex of missing) {
    const periodDeadline = periodDeadlineDate(
      deadlineAt,
      cycle.interval_months,
      periodIndex
    );
    try {
      await db.insert(deadline_penalties).values({
        cycle_id: cycle.id,
        user_id: userId,
        period_index: periodIndex,
        amount: cycle.fine_amount,
        reason: `Atraso no jantar (período ${periodIndex}: prazo ${periodDeadline})`,
        status: "pending",
        period_deadline: periodDeadline,
      });
      created += 1;
    } catch (err) {
      // unique violation under concurrency — ignore
      console.warn("ensureDeadlineState insert race:", err);
    }
  }

  return { cycle, pausePenalties: false, created };
}

type DinnerLike = {
  id: string;
  event_date: string;
  is_completed: boolean | null;
};

/**
 * Called after dinner end sets is_completed=true.
 * Fulfills active cycle and opens a new one from this dinner as anchor.
 * Idempotent if this dinner is already the active anchor.
 */
export async function onDinnerRealized(dinner: DinnerLike): Promise<void> {
  if (!dinner.is_completed) return;

  const active = await getActiveCycle();
  if (active && active.anchor_dinner_id === dinner.id) {
    return; // already opened from this dinner
  }

  if (active) {
    await db
      .update(deadline_cycles)
      .set({ status: "fulfilled", updated_at: new Date() })
      .where(eq(deadline_cycles.id, active.id));
  }

  await openCycleFromDinner(dinner);
}

/**
 * Attach pending deadline penalties for a user onto their payment for a dinner.
 * For ANY payment user (not only the dinner organizer).
 */
export async function attachPendingPenaltiesForUser(
  userId: string,
  dinnerId: string,
  options?: { createdBy?: string | null }
): Promise<number> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.dinner_id, dinnerId), eq(payments.user_id, userId)))
    .limit(1);

  if (!payment) return 0;

  const pending = await db
    .select()
    .from(deadline_penalties)
    .where(
      and(
        eq(deadline_penalties.user_id, userId),
        eq(deadline_penalties.status, "pending"),
        isNull(deadline_penalties.fine_id)
      )
    );

  if (pending.length === 0) return 0;

  const createdBy = options?.createdBy ?? payment.user_id;
  let attached = 0;

  for (const penalty of pending) {
    try {
      const [fine] = await db
        .insert(fines)
        .values({
          payment_id: payment.id,
          amount: penalty.amount,
          reason: penalty.reason,
          created_by: createdBy,
        })
        .returning();

      await db
        .update(deadline_penalties)
        .set({
          status: "attached",
          dinner_id: dinnerId,
          payment_id: payment.id,
          fine_id: fine.id,
          updated_at: new Date(),
        })
        .where(
          and(
            eq(deadline_penalties.id, penalty.id),
            eq(deadline_penalties.status, "pending"),
            isNull(deadline_penalties.fine_id)
          )
        );

      attached += 1;
    } catch (err) {
      console.warn("attachPendingPenaltiesForUser error:", err);
    }
  }

  return attached;
}

/** Catch-up: attach pending penalties for every payment user in a dinner. */
export async function attachPendingPenaltiesForDinner(
  dinnerId: string
): Promise<number> {
  const dinnerPayments = await db
    .select({ user_id: payments.user_id })
    .from(payments)
    .where(eq(payments.dinner_id, dinnerId));

  let total = 0;
  for (const p of dinnerPayments) {
    if (!p.user_id) continue;
    total += await attachPendingPenaltiesForUser(p.user_id, dinnerId);
  }
  return total;
}

export type DeadlineStatusPayload = {
  has_cycle: boolean;
  urgency: DeadlineUrgency;
  pause_penalties: boolean;
  anchor_date: string | null;
  deadline_at: string | null;
  days_left: number | null;
  interval_months: number | null;
  fine_amount: number | null;
  organizer: { id: string; name: string } | null;
  organizer_source: "assigned" | "suggestion" | null;
  organizer_options: { id: string; name: string; role: string }[];
  pending_penalties_count: number;
  pending_penalties_amount: number;
  today: string;
};

export async function getDeadlineStatus(
  today: string = todayLisbon()
): Promise<DeadlineStatusPayload> {
  const { cycle, pausePenalties } = await ensureDeadlineState(today);

  if (!cycle) {
    return {
      has_cycle: false,
      urgency: "none",
      pause_penalties: false,
      anchor_date: null,
      deadline_at: null,
      days_left: null,
      interval_months: null,
      fine_amount: null,
      organizer: null,
      organizer_source: null,
      organizer_options: (await getAllOrganizerOptions()).map((o) => ({
        id: o.id,
        name: o.name,
        role: o.role,
      })),
      pending_penalties_count: 0,
      pending_penalties_amount: 0,
      today,
    };
  }

  const deadlineAt = requireDateString(cycle.deadline_at, "deadline_at");
  const anchorDate = requireDateString(cycle.anchor_date, "anchor_date");
  const daysLeft = daysBetween(today, deadlineAt);
  const urgency = computeUrgency({
    hasCycle: true,
    daysLeft,
    pausePenalties,
    warningDays: DEADLINE_WARNING_DAYS,
  });

  const responsible = await getResponsibleOrganizer(cycle);
  const options = await getAllOrganizerOptions();

  const allPending = await db
    .select({ amount: deadline_penalties.amount })
    .from(deadline_penalties)
    .where(eq(deadline_penalties.status, "pending"));

  const pendingCount = allPending.length;
  const pendingAmount = allPending.reduce((s, r) => s + r.amount, 0);

  return {
    has_cycle: true,
    urgency,
    pause_penalties: pausePenalties,
    anchor_date: anchorDate,
    deadline_at: deadlineAt,
    days_left: daysLeft,
    interval_months: cycle.interval_months,
    fine_amount: cycle.fine_amount,
    organizer: responsible
      ? { id: responsible.id, name: responsible.name }
      : null,
    organizer_source: responsible?.source ?? null,
    organizer_options: options.map((o) => ({
      id: o.id,
      name: o.name,
      role: o.role,
    })),
    pending_penalties_count: pendingCount,
    pending_penalties_amount: pendingAmount,
    today,
  };
}

export async function listPenalties(options: {
  userId: string;
  isAdmin: boolean;
}): Promise<
  (DeadlinePenalty & { user_name: string | null })[]
> {
  await ensureDeadlineState();

  const base = db
    .select({
      id: deadline_penalties.id,
      cycle_id: deadline_penalties.cycle_id,
      user_id: deadline_penalties.user_id,
      period_index: deadline_penalties.period_index,
      amount: deadline_penalties.amount,
      reason: deadline_penalties.reason,
      status: deadline_penalties.status,
      period_deadline: deadline_penalties.period_deadline,
      dinner_id: deadline_penalties.dinner_id,
      payment_id: deadline_penalties.payment_id,
      fine_id: deadline_penalties.fine_id,
      created_at: deadline_penalties.created_at,
      updated_at: deadline_penalties.updated_at,
      waived_by: deadline_penalties.waived_by,
      waived_at: deadline_penalties.waived_at,
      user_name: users.name,
    })
    .from(deadline_penalties)
    .leftJoin(users, eq(deadline_penalties.user_id, users.id))
    .orderBy(desc(deadline_penalties.created_at));

  const rows = options.isAdmin
    ? await base
    : await base.where(eq(deadline_penalties.user_id, options.userId));

  return rows;
}

/** Admin: waive or edit amount / reassign user / re-activate (reemit = edit row). */
export async function patchPenalty(
  penaltyId: string,
  input: {
    amount?: number;
    status?: "pending" | "waived";
    user_id?: string;
    adminUserId: string;
  }
): Promise<DeadlinePenalty | null> {
  const [existing] = await db
    .select()
    .from(deadline_penalties)
    .where(eq(deadline_penalties.id, penaltyId))
    .limit(1);

  if (!existing) return null;

  // Cannot edit attached fines via this path in a meaningful way once fine exists
  if (existing.status === "attached" && existing.fine_id) {
    // Still allow waive? Spec says waive before attach primarily; allow amount only if pending
    if (input.status === "waived") {
      // already attached — no-op or error handled by caller
      return existing;
    }
  }

  const updates: Partial<typeof deadline_penalties.$inferInsert> & {
    updated_at: Date;
  } = { updated_at: new Date() };

  if (input.amount != null && existing.status === "pending") {
    updates.amount = input.amount;
  }
  if (input.user_id && (existing.status === "pending" || existing.status === "waived")) {
    updates.user_id = input.user_id;
  }
  if (input.status === "waived") {
    updates.status = "waived";
    updates.waived_by = input.adminUserId;
    updates.waived_at = new Date();
  }
  if (input.status === "pending" && existing.status === "waived") {
    // reemit: reactivate
    updates.status = "pending";
    updates.waived_by = null;
    updates.waived_at = null;
  }

  const [updated] = await db
    .update(deadline_penalties)
    .set(updates)
    .where(eq(deadline_penalties.id, penaltyId))
    .returning();

  return updated ?? null;
}
