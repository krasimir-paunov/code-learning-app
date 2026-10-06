/**
 * Pure progress transitions: (progress, input, now) → new progress. The store calls these;
 * tests call them directly. Nothing here mutates its input.
 */
import { toLocalDate } from './dates.ts';
import type { ChallengeProgress, LessonProgress, Progress, Settings } from './schema.ts';
import { challengeXp, completionXp } from './xp.ts';

export interface LessonRef {
  id: string;
  version: number;
  /** Every challenge id of the lesson (completion = all passed). */
  challengeIds: readonly string[];
  boss: boolean;
}

const EMPTY_CHALLENGE: ChallengeProgress = { attempts: 0, hintsUsed: 0, revealed: false, xp: 0 };

function lessonOf(progress: Progress, lesson: LessonRef, now: Date): LessonProgress {
  return (
    progress.lessons[lesson.id] ?? {
      startedAt: now.toISOString(),
      contentVersion: lesson.version,
      completionXp: 0,
      challenges: {},
    }
  );
}

function updateChallenge(
  progress: Progress,
  lesson: LessonRef,
  challengeId: string,
  now: Date,
  update: (current: ChallengeProgress) => ChallengeProgress,
): Progress {
  const record = lessonOf(progress, lesson, now);
  const current = record.challenges[challengeId] ?? EMPTY_CHALLENGE;
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [lesson.id]: {
        ...record,
        challenges: { ...record.challenges, [challengeId]: update(current) },
      },
    },
  };
}

function addActivity(progress: Progress, now: Date, xp: number, passed: number): Progress {
  const day = toLocalDate(now);
  const current = progress.activity[day] ?? { xp: 0, passed: 0 };
  return {
    ...progress,
    activity: {
      ...progress.activity,
      [day]: { xp: current.xp + xp, passed: current.passed + passed },
    },
  };
}

/** Opening a lesson marks it in progress (once). */
export function startLesson(progress: Progress, lesson: LessonRef, now: Date): Progress {
  if (progress.lessons[lesson.id]) return progress;
  return {
    ...progress,
    lessons: { ...progress.lessons, [lesson.id]: lessonOf(progress, lesson, now) },
  };
}

export function recordFailedAttempt(
  progress: Progress,
  lesson: LessonRef,
  challengeId: string,
  now: Date,
): Progress {
  if (isPassed(progress, lesson.id, challengeId)) return progress;
  return updateChallenge(progress, lesson, challengeId, now, (c) => ({
    ...c,
    attempts: c.attempts + 1,
  }));
}

export function recordHint(
  progress: Progress,
  lesson: LessonRef,
  challengeId: string,
  now: Date,
): Progress {
  if (isPassed(progress, lesson.id, challengeId)) return progress;
  return updateChallenge(progress, lesson, challengeId, now, (c) => ({
    ...c,
    hintsUsed: c.hintsUsed + 1,
  }));
}

export function recordReveal(
  progress: Progress,
  lesson: LessonRef,
  challengeId: string,
  now: Date,
): Progress {
  if (isPassed(progress, lesson.id, challengeId)) return progress;
  return updateChallenge(progress, lesson, challengeId, now, (c) => ({ ...c, revealed: true }));
}

export function isPassed(progress: Progress, lessonId: string, challengeId: string): boolean {
  return progress.lessons[lessonId]?.challenges[challengeId]?.passedAt !== undefined;
}

export interface PassResult {
  progress: Progress;
  /** XP awarded by this pass (0 if it was already passed). */
  challengeXp: number;
  /** Set when this pass completed the lesson. */
  completionXp?: number;
}

/**
 * A correct submission: counts the attempt, snapshots XP once, logs the day's activity and
 * completes the lesson when every challenge has passed (completion is never revoked).
 */
export function recordPass(
  progress: Progress,
  lesson: LessonRef,
  challengeId: string,
  baseXp: number,
  now: Date,
): PassResult {
  if (isPassed(progress, lesson.id, challengeId)) return { progress, challengeXp: 0 };

  let earned = 0;
  let next = updateChallenge(progress, lesson, challengeId, now, (c) => {
    const attempts = c.attempts + 1;
    earned = challengeXp({ base: baseXp, attempts, hintsUsed: c.hintsUsed, revealed: c.revealed });
    return { ...c, attempts, passedAt: now.toISOString(), xp: earned };
  });
  next = addActivity(next, now, earned, 1);

  const record = next.lessons[lesson.id];
  const allPassed = lesson.challengeIds.every((id) => record?.challenges[id]?.passedAt);
  if (!record || record.completedAt || !allPassed) return { progress: next, challengeXp: earned };

  const bonus = completionXp(lesson.boss);
  next = {
    ...next,
    lessons: {
      ...next.lessons,
      [lesson.id]: {
        ...record,
        completedAt: now.toISOString(),
        contentVersion: lesson.version,
        completionXp: bonus,
      },
    },
  };
  next = addActivity(next, now, bonus, 0);
  return { progress: next, challengeXp: earned, completionXp: bonus };
}

export function updateSettings(progress: Progress, patch: Partial<Settings>): Progress {
  return { ...progress, settings: { ...progress.settings, ...patch } };
}

export function skipRecommendations(progress: Progress, trackId: string): Progress {
  if (progress.skippedRecommendations.includes(trackId)) return progress;
  return { ...progress, skippedRecommendations: [...progress.skippedRecommendations, trackId] };
}

export function restoreRecommendations(progress: Progress, trackId: string): Progress {
  return {
    ...progress,
    skippedRecommendations: progress.skippedRecommendations.filter((id) => id !== trackId),
  };
}

export function markLevelCelebrated(progress: Progress, level: number): Progress {
  if (level <= progress.lastCelebratedLevel) return progress;
  return { ...progress, lastCelebratedLevel: level };
}
