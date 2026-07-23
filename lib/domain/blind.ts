/**
 * Deterministic Fisher-Yates shuffle — same seed => same order for all users.
 * Uses Math.abs so j is never negative (fixes undefined bottle ids).
 */
export function shuffleArray<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    const j = Math.abs(hash) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/** 0-based index → A, B, C, ... */
export function blindLabel(i: number): string {
  return String.fromCharCode(65 + i);
}
