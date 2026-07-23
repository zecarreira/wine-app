import { describe, expect, it } from "vitest";
import {
  canEndDinner,
  canReveal,
  canStartDinner,
  isDinnerHost,
  statusAfterReveal,
} from "@/lib/domain/dinner-lifecycle";

/** R11 — Dinner lifecycle transitions */
describe("R11 dinner lifecycle", () => {
  it("isDinnerHost for host, creator, or admin", () => {
    const dinner = { host_id: "h1", created_by: "c1" };
    expect(isDinnerHost("h1", dinner)).toBe(true);
    expect(isDinnerHost("c1", dinner)).toBe(true);
    expect(isDinnerHost("other", dinner)).toBe(false);
    expect(isDinnerHost("other", dinner, true)).toBe(true);
  });

  it("canStartDinner requires setup + bottles", () => {
    expect(canStartDinner("setup", 2)).toEqual({ ok: true });
    expect(canStartDinner("setup", 0).ok).toBe(false);
    expect(canStartDinner("active", 2).ok).toBe(false);
  });

  it("canEndDinner for regular and extra dinners", () => {
    expect(canEndDinner("active", false)).toEqual({ ok: true });
    expect(canEndDinner("setup", false).ok).toBe(false);
    expect(canEndDinner("setup", true)).toEqual({ ok: true });
    expect(canEndDinner("active", true)).toEqual({ ok: true });
    expect(canEndDinner("completed", true).ok).toBe(false);
  });

  it("canReveal only after ended", () => {
    expect(canReveal("ended")).toEqual({ ok: true });
    expect(canReveal("revealing")).toEqual({ ok: true });
    expect(canReveal("setup").ok).toBe(false);
    expect(canReveal("active").ok).toBe(false);
  });

  it("statusAfterReveal", () => {
    expect(statusAfterReveal(false)).toBe("revealing");
    expect(statusAfterReveal(true)).toBe("completed");
  });
});
