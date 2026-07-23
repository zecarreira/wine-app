import { describe, expect, it } from "vitest";
import { pickNextReveal, revealMedal } from "@/lib/domain/reveal";

/** R05 — Reveal ceremony order (winner before runner-up at end) */
describe("R05 reveal", () => {
  it("returns null when nothing remains", () => {
    expect(pickNextReveal(5, 5)).toBeNull();
    expect(pickNextReveal(0, 0)).toBeNull();
  });

  it("reveals worst first until 2 remain", () => {
    // 5 bottles, 0 revealed → position 5 at index 0
    expect(pickNextReveal(5, 0)).toEqual({
      index: 0,
      position: 5,
      isWinner: false,
      isRunnerUp: false,
    });
    expect(pickNextReveal(5, 1)).toEqual({
      index: 1,
      position: 4,
      isWinner: false,
      isRunnerUp: false,
    });
    expect(pickNextReveal(5, 2)).toEqual({
      index: 2,
      position: 3,
      isWinner: false,
      isRunnerUp: false,
    });
  });

  it("with 2 remaining reveals winner (index total-1, pos 1)", () => {
    expect(pickNextReveal(5, 3)).toEqual({
      index: 4,
      position: 1,
      isWinner: true,
      isRunnerUp: false,
    });
  });

  it("with 1 remaining reveals runner-up (index total-2, pos 2)", () => {
    expect(pickNextReveal(5, 4)).toEqual({
      index: 3,
      position: 2,
      isWinner: false,
      isRunnerUp: true,
    });
  });

  it("revealMedal messages match ceremony copy", () => {
    expect(revealMedal(1, true, false)).toEqual({
      message: "🏆 E O VENCEDOR É...",
      medal: "🏆",
    });
    expect(revealMedal(2, false, true)).toEqual({
      message: "🥈 O Segundo Classificado É...",
      medal: "🥈",
    });
    expect(revealMedal(3, false, false)).toEqual({
      message: "🥉 O Terceiro Lugar vai para...",
      medal: "🥉",
    });
    expect(revealMedal(5, false, false)).toEqual({
      message: "Posição 5...",
      medal: "#5",
    });
  });
});
