import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  addDays,
  computeDeadline,
  computeUrgency,
  daysBetween,
  defaultPollWindow,
  periodDeadlineDate,
  periodsDue,
  shouldPausePenalties,
} from "@/lib/domain/deadline";
import {
  DEFAULT_DEADLINE_FINE,
  DEFAULT_DINNER_INTERVAL_MONTHS,
  OVERDUE_POLL_HORIZON_DAYS,
} from "@/lib/domain/constants";

describe("addCalendarMonths", () => {
  it("adds months within year", () => {
    expect(addCalendarMonths("2024-01-15", 6)).toBe("2024-07-15");
  });

  it("crosses year boundary", () => {
    expect(addCalendarMonths("2024-10-10", 6)).toBe("2025-04-10");
  });

  it("clamps end-of-month (Jan 31 + 1 → Feb 29 in leap year)", () => {
    expect(addCalendarMonths("2024-01-31", 1)).toBe("2024-02-29");
  });

  it("clamps end-of-month non-leap", () => {
    expect(addCalendarMonths("2023-01-31", 1)).toBe("2023-02-28");
  });

  it("Jan 31 + 2 months → Mar 31", () => {
    expect(addCalendarMonths("2024-01-31", 2)).toBe("2024-03-31");
  });
});

describe("computeDeadline", () => {
  it("defaults to 6 months", () => {
    expect(computeDeadline("2024-01-01")).toBe("2024-07-01");
    expect(DEFAULT_DINNER_INTERVAL_MONTHS).toBe(6);
    expect(DEFAULT_DEADLINE_FINE).toBe(20);
  });

  it("uses custom interval", () => {
    expect(computeDeadline("2024-01-01", 4)).toBe("2024-05-01");
  });
});

describe("periodsDue", () => {
  it("returns empty before deadline", () => {
    expect(periodsDue("2024-07-01", 6, "2024-06-30")).toEqual([]);
  });

  it("returns [1] on deadline day", () => {
    expect(periodsDue("2024-07-01", 6, "2024-07-01")).toEqual([1]);
  });

  it("returns [1] between first and second marco", () => {
    expect(periodsDue("2024-07-01", 6, "2024-12-01")).toEqual([1]);
  });

  it("returns [1,2] on second marco", () => {
    expect(periodsDue("2024-07-01", 6, "2025-01-01")).toEqual([1, 2]);
  });

  it("returns three periods after two intervals", () => {
    expect(periodsDue("2024-07-01", 6, "2025-07-01")).toEqual([1, 2, 3]);
  });
});

describe("periodDeadlineDate", () => {
  it("period 1 is deadlineAt", () => {
    expect(periodDeadlineDate("2024-07-01", 6, 1)).toBe("2024-07-01");
  });

  it("period 2 is +interval", () => {
    expect(periodDeadlineDate("2024-07-01", 6, 2)).toBe("2025-01-01");
  });
});

describe("shouldPausePenalties", () => {
  it("false below 7 regular completed", () => {
    expect(shouldPausePenalties({ regularCompletedCount: 6 })).toBe(false);
    expect(shouldPausePenalties({ regularCompletedCount: 0 })).toBe(false);
  });

  it("true at 7+", () => {
    expect(shouldPausePenalties({ regularCompletedCount: 7 })).toBe(true);
    expect(shouldPausePenalties({ regularCompletedCount: 8 })).toBe(true);
  });
});

describe("defaultPollWindow", () => {
  it("uses deadline when still in the future", () => {
    expect(defaultPollWindow("2024-01-01", "2024-06-15")).toEqual({
      start: "2024-01-02",
      end: "2024-06-15",
    });
  });

  it("overdue fallback today+1 .. today+45", () => {
    expect(OVERDUE_POLL_HORIZON_DAYS).toBe(45);
    expect(defaultPollWindow("2024-08-01", "2024-07-01")).toEqual({
      start: "2024-08-02",
      end: "2024-09-15",
    });
  });

  it("enforces end >= start", () => {
    const w = defaultPollWindow("2024-01-01", "2024-01-01", 0);
    expect(w.start).toBe("2024-01-02");
    expect(w.end >= w.start).toBe(true);
  });
});

describe("addDays / daysBetween", () => {
  it("addDays", () => {
    expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
  });

  it("daysBetween", () => {
    expect(daysBetween("2024-01-01", "2024-01-11")).toBe(10);
    expect(daysBetween("2024-01-11", "2024-01-01")).toBe(-10);
  });
});

describe("computeUrgency", () => {
  it("none without cycle", () => {
    expect(
      computeUrgency({ hasCycle: false, daysLeft: null, pausePenalties: false })
    ).toBe("none");
  });

  it("paused when pause flag", () => {
    expect(
      computeUrgency({ hasCycle: true, daysLeft: -5, pausePenalties: true })
    ).toBe("paused");
  });

  it("overdue / warning / ok", () => {
    expect(
      computeUrgency({ hasCycle: true, daysLeft: -1, pausePenalties: false })
    ).toBe("overdue");
    expect(
      computeUrgency({ hasCycle: true, daysLeft: 10, pausePenalties: false })
    ).toBe("warning");
    expect(
      computeUrgency({ hasCycle: true, daysLeft: 60, pausePenalties: false })
    ).toBe("ok");
  });
});
