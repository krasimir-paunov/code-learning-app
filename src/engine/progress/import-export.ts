import { APP_SLUG, STORAGE_NAMESPACE } from '../../config/app.ts';
import { toLocalDate } from './dates.ts';
import { migrate } from './migrations/index.ts';
import type { ChallengeProgress, LessonProgress, Progress } from './schema.ts';

/** Fixed like the storage namespace, so backups survive a rename of the app. */
export const EXPORT_FORMAT = `${STORAGE_NAMESPACE}-progress`;

export interface ProgressExport {
  format: string;
  schemaVersion: number;
  exportedAt: string;
  progress: Progress;
}

export function createExport(progress: Progress, now: Date): ProgressExport {
  return {
    format: EXPORT_FORMAT,
    schemaVersion: progress.schemaVersion,
    exportedAt: now.toISOString(),
    progress,
  };
}

export function exportFileName(now: Date): string {
  return `${APP_SLUG}-progress-${toLocalDate(now)}.json`;
}

export type ParseBackupResult = { ok: true; progress: Progress } | { ok: false; error: string };

/** Validates a backup completely before anything is applied (never partially imported). */
export function parseBackup(text: string): ParseBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'This file is not a progress backup.' };
  }
  const envelope = data as Partial<Record<keyof ProgressExport, unknown>>;
  if (envelope.format !== EXPORT_FORMAT) {
    return { ok: false, error: 'This file is not a progress backup from this app.' };
  }
  if (envelope.progress === undefined) {
    return { ok: false, error: 'The backup contains no progress data.' };
  }
  return migrate(envelope.progress);
}

function earliest(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a <= b ? a : b;
}

function mergeChallenge(a: ChallengeProgress, b: ChallengeProgress): ChallengeProgress {
  const passedAt = earliest(a.passedAt, b.passedAt);
  return {
    attempts: Math.max(a.attempts, b.attempts),
    hintsUsed: Math.max(a.hintsUsed, b.hintsUsed),
    revealed: a.revealed || b.revealed,
    xp: Math.max(a.xp, b.xp),
    ...(passedAt && { passedAt }),
  };
}

function mergeLesson(a: LessonProgress, b: LessonProgress): LessonProgress {
  const challenges: Record<string, ChallengeProgress> = { ...a.challenges };
  for (const [id, challenge] of Object.entries(b.challenges)) {
    const existing = challenges[id];
    challenges[id] = existing ? mergeChallenge(existing, challenge) : challenge;
  }
  const completedAt = earliest(a.completedAt, b.completedAt);
  return {
    startedAt: earliest(a.startedAt, b.startedAt) ?? a.startedAt,
    contentVersion: Math.max(a.contentVersion, b.contentVersion),
    completionXp: Math.max(a.completionXp, b.completionXp),
    challenges,
    ...(completedAt && { completedAt }),
  };
}

/**
 * Merge: union of lessons; per challenge the earliest pass and the higher XP; union of
 * activity days (the higher value per day, so the same day is never counted twice).
 * The current device keeps its own settings.
 */
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  const lessons: Record<string, LessonProgress> = { ...current.lessons };
  for (const [id, lesson] of Object.entries(incoming.lessons)) {
    const existing = lessons[id];
    lessons[id] = existing ? mergeLesson(existing, lesson) : lesson;
  }
  const activity = { ...current.activity };
  for (const [day, value] of Object.entries(incoming.activity)) {
    const existing = activity[day];
    activity[day] = existing
      ? { xp: Math.max(existing.xp, value.xp), passed: Math.max(existing.passed, value.passed) }
      : value;
  }
  return {
    ...current,
    createdAt: earliest(current.createdAt, incoming.createdAt) ?? current.createdAt,
    lessons,
    activity,
    lastCelebratedLevel: Math.max(current.lastCelebratedLevel, incoming.lastCelebratedLevel),
    skippedRecommendations: [
      ...new Set([...current.skippedRecommendations, ...incoming.skippedRecommendations]),
    ],
  };
}
