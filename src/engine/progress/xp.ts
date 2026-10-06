/** XP rules (ARCHITECTURE §9). Snapshots are stored, so changing these is never retroactive. */
export const FIRST_TRY_MULTIPLIER = 1.5;
export const HINT_PENALTY = 0.25;
export const HINT_FLOOR = 0.25;
export const LESSON_COMPLETION_XP = 20;
export const BOSS_COMPLETION_XP = 100;

export interface ChallengeXpInput {
  /** The type default or the spec's override. */
  base: number;
  /** Attempts including the passing one. */
  attempts: number;
  hintsUsed: number;
  revealed: boolean;
}

export function challengeXp({ base, attempts, hintsUsed, revealed }: ChallengeXpInput): number {
  if (revealed) return 0;
  if (hintsUsed === 0 && attempts === 1) return Math.round(base * FIRST_TRY_MULTIPLIER);
  const multiplier = Math.max(HINT_FLOOR, 1 - HINT_PENALTY * hintsUsed);
  return Math.round(base * multiplier);
}

export function completionXp(boss: boolean): number {
  return boss ? BOSS_COMPLETION_XP : LESSON_COMPLETION_XP;
}

/** Cumulative XP needed to reach `level`: 50 · L · (L − 1). L1 = 0, L2 = 100, L3 = 300. */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level spans. */
  span: number;
  fraction: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const start = xpForLevel(level);
  const span = xpForLevel(level + 1) - start;
  const into = xp - start;
  return { level, into, span, fraction: into / span };
}
