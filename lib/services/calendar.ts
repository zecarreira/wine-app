import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  availability_days,
  availability_polls,
  availability_responses,
  dinners,
  seasons,
  users,
} from "@/lib/schema";
import {
  defaultPollWindow,
  hasScheduledDinner,
  isExtraDinner as computeIsExtraDinner,
  isSeasonFull,
  MIN_AVAILABLE_FOR_SCHEDULED_DINNER,
  nextDinnerNumber,
  organizerAlreadyUsed,
  requireDateString,
  toDateString,
  todayLisbon,
} from "@/lib/domain";
import {
  getActiveCycle,
  getAvailableOrganizers,
  getCurrentOrganizerSuggestion,
  ensureDeadlineState,
} from "@/lib/services/deadline";

export type AvailabilityPoll = typeof availability_polls.$inferSelect;

export async function getOpenPoll(): Promise<AvailabilityPoll | null> {
  const [poll] = await db
    .select()
    .from(availability_polls)
    .where(eq(availability_polls.status, "open"))
    .limit(1);
  return poll ?? null;
}

export async function getActivePollPayload(viewerUserId: string) {
  await ensureDeadlineState();
  const poll = await getOpenPoll();
  if (!poll) {
    return { poll: null as null, responses: [], day_counts: {} as Record<string, number>, my_response: null, founders_total: 0 };
  }

  const founders = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, ["founder", "admin"]))
    .orderBy(asc(users.name));

  const responses = await db
    .select({
      id: availability_responses.id,
      poll_id: availability_responses.poll_id,
      user_id: availability_responses.user_id,
      status: availability_responses.status,
      submitted_at: availability_responses.submitted_at,
      user_name: users.name,
    })
    .from(availability_responses)
    .leftJoin(users, eq(availability_responses.user_id, users.id))
    .where(eq(availability_responses.poll_id, poll.id));

  const responseIds = responses.map((r) => r.id);
  const days =
    responseIds.length > 0
      ? await db
          .select()
          .from(availability_days)
          .where(inArray(availability_days.response_id, responseIds))
      : [];

  const daysByResponse = new Map<string, string[]>();
  const dayCounts: Record<string, number> = {};
  for (const d of days) {
    const dayStr = toDateString(d.day);
    if (!dayStr) continue;
    const list = daysByResponse.get(d.response_id) ?? [];
    list.push(dayStr);
    daysByResponse.set(d.response_id, list);
    // Only count submitted responses for heatmap
  }

  const submittedResponseIds = new Set(
    responses.filter((r) => r.status === "submitted").map((r) => r.id)
  );
  for (const d of days) {
    if (!submittedResponseIds.has(d.response_id)) continue;
    const dayStr = toDateString(d.day);
    if (!dayStr) continue;
    dayCounts[dayStr] = (dayCounts[dayStr] ?? 0) + 1;
  }

  const responsesWithDays = responses.map((r) => ({
    ...r,
    days: daysByResponse.get(r.id) ?? [],
  }));

  const my = responsesWithDays.find((r) => r.user_id === viewerUserId) ?? null;

  let suggested: { id: string; name: string } | null = null;
  if (poll.suggested_organizer_id) {
    const [u] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, poll.suggested_organizer_id))
      .limit(1);
    suggested = u ?? null;
  }

  const windowStart = requireDateString(poll.window_start, "window_start");
  const windowEnd = requireDateString(poll.window_end, "window_end");

  return {
    poll: {
      ...poll,
      window_start: windowStart,
      window_end: windowEnd,
      chosen_date: poll.chosen_date
        ? toDateString(poll.chosen_date)
        : null,
      suggested_organizer: suggested,
    },
    responses: responsesWithDays,
    day_counts: dayCounts,
    my_response: my,
    founders_total: founders.length,
    submitted_count: responses.filter((r) => r.status === "submitted").length,
  };
}

export async function openPoll(input: {
  createdBy: string;
  window_start?: string;
  window_end?: string;
}): Promise<AvailabilityPoll> {
  const existing = await getOpenPoll();
  if (existing) {
    throw new Error("Já existe um poll aberto");
  }

  await ensureDeadlineState();
  const cycle = await getActiveCycle();
  const today = todayLisbon();

  let windowStart = input.window_start;
  let windowEnd = input.window_end;

  if (!windowStart || !windowEnd) {
    const deadlineAt = cycle
      ? requireDateString(cycle.deadline_at, "deadline_at")
      : today;
    const def = defaultPollWindow(today, deadlineAt);
    windowStart = windowStart ?? def.start;
    windowEnd = windowEnd ?? def.end;
  }

  if (windowEnd < windowStart) {
    throw new Error("window_end deve ser >= window_start");
  }

  const suggestion = await getCurrentOrganizerSuggestion();

  try {
    const [poll] = await db
      .insert(availability_polls)
      .values({
        status: "open",
        window_start: windowStart,
        window_end: windowEnd,
        suggested_organizer_id: suggestion?.id ?? null,
        created_by: input.createdBy,
      })
      .returning();
    return poll;
  } catch {
    // partial unique under race
    throw new Error("Já existe um poll aberto");
  }
}

export async function patchPoll(
  pollId: string,
  input: {
    window_start?: string;
    window_end?: string;
    status?: "cancelled" | "closed";
  }
): Promise<AvailabilityPoll | null> {
  const [poll] = await db
    .select()
    .from(availability_polls)
    .where(eq(availability_polls.id, pollId))
    .limit(1);
  if (!poll) return null;

  const updates: Record<string, unknown> = {};
  const start = input.window_start ?? requireDateString(poll.window_start, "window_start");
  const end = input.window_end ?? requireDateString(poll.window_end, "window_end");
  if (end < start) {
    throw new Error("window_end deve ser >= window_start");
  }
  if (input.window_start) updates.window_start = input.window_start;
  if (input.window_end) updates.window_end = input.window_end;
  if (input.status === "cancelled" || input.status === "closed") {
    updates.status = input.status;
    updates.closed_at = new Date();
  }

  const [updated] = await db
    .update(availability_polls)
    .set(updates)
    .where(eq(availability_polls.id, pollId))
    .returning();
  return updated ?? null;
}

export async function respondToPoll(input: {
  pollId: string;
  userId: string;
  days: string[];
}): Promise<{ responseId: string; days: string[] }> {
  const [poll] = await db
    .select()
    .from(availability_polls)
    .where(eq(availability_polls.id, input.pollId))
    .limit(1);

  if (!poll || poll.status !== "open") {
    throw new Error("Poll não está aberto");
  }

  const windowStart = requireDateString(poll.window_start, "window_start");
  const windowEnd = requireDateString(poll.window_end, "window_end");
  const validDays = input.days.filter(
    (d) => d >= windowStart && d <= windowEnd
  );
  // dedupe
  const uniqueDays = [...new Set(validDays)].sort();

  const [existing] = await db
    .select()
    .from(availability_responses)
    .where(
      and(
        eq(availability_responses.poll_id, input.pollId),
        eq(availability_responses.user_id, input.userId)
      )
    )
    .limit(1);

  let responseId: string;
  if (existing) {
    responseId = existing.id;
    await db
      .update(availability_responses)
      .set({ status: "submitted", submitted_at: new Date() })
      .where(eq(availability_responses.id, responseId));
    // replace days
    await db
      .delete(availability_days)
      .where(eq(availability_days.response_id, responseId));
  } else {
    const [created] = await db
      .insert(availability_responses)
      .values({
        poll_id: input.pollId,
        user_id: input.userId,
        status: "submitted",
        submitted_at: new Date(),
      })
      .returning();
    responseId = created.id;
  }

  if (uniqueDays.length > 0) {
    await db.insert(availability_days).values(
      uniqueDays.map((day) => ({ response_id: responseId, day }))
    );
  }

  return { responseId, days: uniqueDays };
}

/**
 * Admin chooses a date → create dinner (same rules as POST /api/dinners),
 * close poll. Recalculates organizer (alpha) unless override provided.
 */
export async function chooseDate(input: {
  pollId: string;
  date: string;
  organizerId?: string | null;
  createdBy: string;
}): Promise<{ dinner: typeof dinners.$inferSelect; poll: AvailabilityPoll }> {
  const [poll] = await db
    .select()
    .from(availability_polls)
    .where(eq(availability_polls.id, input.pollId))
    .limit(1);

  if (!poll || poll.status !== "open") {
    throw new Error("Poll não está aberto");
  }

  const windowStart = requireDateString(poll.window_start, "window_start");
  const windowEnd = requireDateString(poll.window_end, "window_end");
  if (input.date < windowStart || input.date > windowEnd) {
    throw new Error("Data fora da janela do poll");
  }

  const [activeSeason] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.status, "active"))
    .limit(1);

  if (!activeSeason) {
    throw new Error("Sem temporada ativa");
  }

  const seasonDinners = await db
    .select({
      organizer_id: dinners.organizer_id,
      status: dinners.status,
    })
    .from(dinners)
    .where(eq(dinners.season_id, activeSeason.id));

  if (hasScheduledDinner(seasonDinners.map((d) => d.status))) {
    throw new Error(
      "Já existe um jantar marcado. Só podes marcar o próximo depois de o actual terminar."
    );
  }

  // Count founder|admin with submitted "Posso" on this date
  const availableRows = await db
    .select({ user_id: availability_responses.user_id })
    .from(availability_responses)
    .innerJoin(
      availability_days,
      eq(availability_days.response_id, availability_responses.id)
    )
    .innerJoin(users, eq(users.id, availability_responses.user_id))
    .where(
      and(
        eq(availability_responses.poll_id, input.pollId),
        eq(availability_responses.status, "submitted"),
        eq(availability_days.day, input.date),
        inArray(users.role, ["founder", "admin"])
      )
    );

  const availableCount = new Set(availableRows.map((r) => r.user_id)).size;
  if (availableCount < MIN_AVAILABLE_FOR_SCHEDULED_DINNER) {
    throw new Error(
      "São necessários pelo menos 6 membros disponíveis (Posso) neste dia."
    );
  }

  if (isSeasonFull(seasonDinners.length)) {
    throw new Error("Temporada cheia (máx. 8 jantares)");
  }

  const dinnerNumber = nextDinnerNumber(seasonDinners.length);
  const isExtra = computeIsExtraDinner(dinnerNumber);

  let organizerId: string | null = null;
  if (!isExtra) {
    const available = await getAvailableOrganizers();
    if (available.length === 0) {
      throw new Error("Sem organizadores disponíveis");
    }
    const cycle = await getActiveCycle();
    const candidateId =
      input.organizerId ?? cycle?.responsible_organizer_id ?? available[0].id;

    const [org] = await db
      .select({ id: users.id, role: users.role, name: users.name })
      .from(users)
      .where(eq(users.id, candidateId))
      .limit(1);
    if (!org || (org.role !== "founder" && org.role !== "admin")) {
      // Invalid candidate → fall back to first available
      organizerId = available[0].id;
    } else {
      const existingIds = seasonDinners
        .map((d) => d.organizer_id)
        .filter((id): id is string => Boolean(id));
      if (organizerAlreadyUsed(existingIds, candidateId)) {
        // Already organized this season → fall back to first available
        organizerId = available[0].id;
      } else {
        organizerId = candidateId;
      }
    }
  }

  let organizerName = "Organizador";
  if (organizerId) {
    const [u] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, organizerId))
      .limit(1);
    if (u) organizerName = u.name;
  }

  const dinnerName = isExtra
    ? "Jantar Extra"
    : `Jantar do ${organizerName}`;

  const [newDinner] = await db
    .insert(dinners)
    .values({
      name: dinnerName,
      event_date: input.date,
      location: null,
      is_blind: true,
      created_by: input.createdBy,
      organizer_id: organizerId,
      season_id: activeSeason.id,
      dinner_number_in_season: dinnerNumber,
      is_extra_dinner: isExtra,
      status: "setup",
    })
    .returning();

  const [closed] = await db
    .update(availability_polls)
    .set({
      status: "closed",
      chosen_date: input.date,
      created_dinner_id: newDinner.id,
      closed_at: new Date(),
    })
    .where(eq(availability_polls.id, input.pollId))
    .returning();

  return { dinner: newDinner, poll: closed };
}
