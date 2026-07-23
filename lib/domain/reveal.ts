export type RevealPick = {
  /** Index into worst→best sorted list */
  index: number;
  /** Display rank position (1 = winner) */
  position: number;
  isWinner: boolean;
  isRunnerUp: boolean;
};

/**
 * Special reveal order: worst→best until 2 remain, then winner (pos 1)
 * is revealed before runner-up (pos 2) for suspense.
 * Returns null when nothing left to reveal.
 */
export function pickNextReveal(
  totalBottles: number,
  revealedSoFar: number
): RevealPick | null {
  const remaining = totalBottles - revealedSoFar;
  if (remaining <= 0) return null;

  if (remaining === 2) {
    return {
      index: totalBottles - 1,
      position: 1,
      isWinner: true,
      isRunnerUp: false,
    };
  }

  if (remaining === 1) {
    return {
      index: totalBottles - 2,
      position: 2,
      isWinner: false,
      isRunnerUp: true,
    };
  }

  return {
    index: revealedSoFar,
    position: totalBottles - revealedSoFar,
    isWinner: false,
    isRunnerUp: false,
  };
}

export function revealMedal(
  position: number,
  isWinner: boolean,
  isRunnerUp: boolean
): { message: string; medal: string } {
  if (isWinner) {
    return { message: "🏆 E O VENCEDOR É...", medal: "🏆" };
  }
  if (isRunnerUp) {
    return { message: "🥈 O Segundo Classificado É...", medal: "🥈" };
  }
  if (position === 3) {
    return { message: "🥉 O Terceiro Lugar vai para...", medal: "🥉" };
  }
  return { message: `Posição ${position}...`, medal: `#${position}` };
}
