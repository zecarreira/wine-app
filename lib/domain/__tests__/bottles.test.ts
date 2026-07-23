import { describe, expect, it } from "vitest";
import {
  canAddBottle,
  maxBottlesForUser,
  nextBottlePosition,
} from "@/lib/domain/bottles";

/** R09 — Bottle limits (organizer 2, others 1) */
describe("R09 bottles", () => {
  it("maxBottlesForUser", () => {
    expect(maxBottlesForUser(true)).toBe(2);
    expect(maxBottlesForUser(false)).toBe(1);
  });

  it("canAddBottle allows under limit", () => {
    expect(canAddBottle(0, false)).toEqual({ ok: true });
    expect(canAddBottle(0, true)).toEqual({ ok: true });
    expect(canAddBottle(1, true)).toEqual({ ok: true });
  });

  it("canAddBottle Portuguese errors at limit", () => {
    expect(canAddBottle(1, false)).toEqual({
      ok: false,
      error:
        "Já adicionaste 1 garrafa para este jantar. Apenas o organizador pode adicionar 2 garrafas.",
    });
    expect(canAddBottle(2, true)).toEqual({
      ok: false,
      error: "Organizador já adicionou o máximo de 2 garrafas para este jantar",
    });
  });

  it("nextBottlePosition", () => {
    expect(nextBottlePosition(null)).toBe(1);
    expect(nextBottlePosition(undefined)).toBe(1);
    expect(nextBottlePosition(3)).toBe(4);
  });
});
