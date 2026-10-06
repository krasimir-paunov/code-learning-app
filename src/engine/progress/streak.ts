import { addDays } from './dates.ts';

type Activity = Record<string, { xp: number; passed: number }>;

/** A day counts when at least one challenge passed that day. */
function activeDays(activity: Activity): Set<string> {
  return new Set(Object.keys(activity).filter((day) => (activity[day]?.passed ?? 0) > 0));
}

/**
 * Consecutive active days ending today, or ending yesterday (today is not over yet,
 * so a streak is never shown as broken before the day ends).
 */
export function currentStreak(activity: Activity, today: string): number {
  const days = activeDays(activity);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(activity: Activity): number {
  const days = [...activeDays(activity)].sort();
  let best = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of days) {
    run = previous !== undefined && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}
