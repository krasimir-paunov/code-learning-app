import type { Progress } from './schema.ts';
import { currentStreak, longestStreak } from './streak.ts';
import { levelForXp } from './xp.ts';

/** Total XP is never stored: it is the sum of the snapshots. */
export function totalXp(progress: Progress): number {
  let sum = 0;
  for (const lesson of Object.values(progress.lessons)) {
    sum += lesson.completionXp;
    for (const challenge of Object.values(lesson.challenges)) sum += challenge.xp;
  }
  return sum;
}

export function completedLessonIds(progress: Progress): Set<string> {
  return new Set(
    Object.entries(progress.lessons)
      .filter(([, lesson]) => lesson.completedAt)
      .map(([id]) => id),
  );
}

export interface ProgressSummary {
  xp: number;
  level: number;
  lessonsCompleted: number;
  lessonsStarted: number;
  challengesPassed: number;
  currentStreak: number;
  longestStreak: number;
}

export function summarize(progress: Progress, today: string): ProgressSummary {
  const xp = totalXp(progress);
  const lessons = Object.values(progress.lessons);
  return {
    xp,
    level: levelForXp(xp),
    lessonsCompleted: lessons.filter((l) => l.completedAt).length,
    lessonsStarted: lessons.length,
    challengesPassed: lessons.reduce(
      (n, l) => n + Object.values(l.challenges).filter((c) => c.passedAt).length,
      0,
    ),
    currentStreak: currentStreak(progress.activity, today),
    longestStreak: longestStreak(progress.activity),
  };
}
