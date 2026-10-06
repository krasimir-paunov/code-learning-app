import { describe, expect, it } from 'vitest';
import { addDays, toLocalDate } from './dates.ts';
import { currentStreak, longestStreak } from './streak.ts';

const days = (...dates: string[]) =>
  Object.fromEntries(dates.map((d) => [d, { xp: 10, passed: 1 }]));

describe('dates', () => {
  it('formats the local calendar date', () => {
    expect(toLocalDate(new Date(2026, 9, 6, 23, 59))).toBe('2026-10-06');
    expect(toLocalDate(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });

  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });
});

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(days('2026-10-04', '2026-10-05', '2026-10-06'), '2026-10-06')).toBe(3);
  });

  it('still counts a streak that ended yesterday (today is not over)', () => {
    expect(currentStreak(days('2026-10-04', '2026-10-05'), '2026-10-06')).toBe(2);
  });

  it('is broken by a missed day', () => {
    expect(currentStreak(days('2026-10-03', '2026-10-04'), '2026-10-06')).toBe(0);
  });

  it('ignores days with XP but no passed challenge', () => {
    const activity = { ...days('2026-10-05'), '2026-10-06': { xp: 0, passed: 0 } };
    expect(currentStreak(activity, '2026-10-06')).toBe(1);
  });
});

describe('longestStreak', () => {
  it('finds the longest run anywhere in history', () => {
    const activity = days(
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-10',
      '2026-10-05',
      '2026-10-06',
    );
    expect(longestStreak(activity)).toBe(4);
  });

  it('is zero without activity', () => {
    expect(longestStreak({})).toBe(0);
  });
});
