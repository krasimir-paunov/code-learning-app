import { describe, expect, it } from 'vitest';
import {
  markLevelCelebrated,
  recordFailedAttempt,
  recordHint,
  recordPass,
  recordReveal,
  restoreRecommendations,
  skipRecommendations,
  startLesson,
  type LessonRef,
} from './actions.ts';
import { summarize, totalXp } from './derive.ts';
import { createEmptyProgress } from './schema.ts';

const NOW = new Date('2026-10-06T10:00:00Z');
const LATER = new Date('2026-10-06T10:05:00Z');
const lesson: LessonRef = {
  id: 'algo.binary-search',
  version: 1,
  challengeIds: ['a', 'b'],
  boss: false,
};

describe('progress actions', () => {
  it('starts a lesson once and never mutates the input', () => {
    const empty = createEmptyProgress(NOW);
    const started = startLesson(empty, lesson, NOW);
    expect(empty.lessons).toEqual({});
    expect(started.lessons[lesson.id]?.startedAt).toBe(NOW.toISOString());
    expect(startLesson(started, lesson, LATER)).toBe(started);
  });

  it('awards first-try XP and logs the day', () => {
    const { progress, challengeXp } = recordPass(createEmptyProgress(NOW), lesson, 'a', 10, NOW);
    expect(challengeXp).toBe(15);
    expect(progress.lessons[lesson.id]?.challenges.a).toMatchObject({ attempts: 1, xp: 15 });
    expect(progress.activity['2026-10-06']).toEqual({ xp: 15, passed: 1 });
  });

  it('counts failed attempts and hints against the award', () => {
    let p = createEmptyProgress(NOW);
    p = recordFailedAttempt(p, lesson, 'a', NOW);
    p = recordHint(p, lesson, 'a', NOW);
    const { challengeXp } = recordPass(p, lesson, 'a', 20, NOW);
    expect(challengeXp).toBe(15); // 20 × 75%, no first-try bonus
  });

  it('gives 0 XP after reveal but still passes the challenge', () => {
    const p = recordReveal(createEmptyProgress(NOW), lesson, 'a', NOW);
    const { progress, challengeXp } = recordPass(p, lesson, 'a', 20, NOW);
    expect(challengeXp).toBe(0);
    expect(progress.lessons[lesson.id]?.challenges.a?.passedAt).toBeDefined();
  });

  it('awards XP once; passing again changes nothing', () => {
    const first = recordPass(createEmptyProgress(NOW), lesson, 'a', 10, NOW).progress;
    const again = recordPass(first, lesson, 'a', 10, LATER);
    expect(again.challengeXp).toBe(0);
    expect(again.progress).toBe(first);
    expect(recordHint(first, lesson, 'a', LATER)).toBe(first);
  });

  it('completes the lesson when every challenge has passed (+20, boss +100)', () => {
    let p = recordPass(createEmptyProgress(NOW), lesson, 'a', 10, NOW).progress;
    expect(p.lessons[lesson.id]?.completedAt).toBeUndefined();
    const done = recordPass(p, lesson, 'b', 10, LATER);
    expect(done.completionXp).toBe(20);
    p = done.progress;
    expect(p.lessons[lesson.id]).toMatchObject({
      completedAt: LATER.toISOString(),
      completionXp: 20,
    });
    expect(totalXp(p)).toBe(15 + 15 + 20);
    expect(p.activity['2026-10-06']).toEqual({ xp: 50, passed: 2 });

    const boss = { ...lesson, id: 'algo.boss', challengeIds: ['x'], boss: true };
    expect(recordPass(p, boss, 'x', 10, LATER).completionXp).toBe(100);
  });

  it('never revokes completion when the lesson later gains a challenge', () => {
    let p = recordPass(createEmptyProgress(NOW), lesson, 'a', 10, NOW).progress;
    p = recordPass(p, lesson, 'b', 10, NOW).progress;
    const v2 = { ...lesson, version: 2, challengeIds: ['a', 'b', 'c'] };
    const after = recordPass(p, v2, 'c', 10, LATER);
    expect(after.completionXp).toBeUndefined();
    expect(after.progress.lessons[lesson.id]?.completedAt).toBe(NOW.toISOString());
  });

  it('skips and restores recommendations per track', () => {
    let p = skipRecommendations(createEmptyProgress(NOW), 'cs');
    expect(skipRecommendations(p, 'cs')).toBe(p);
    expect(p.skippedRecommendations).toEqual(['cs']);
    p = restoreRecommendations(p, 'cs');
    expect(p.skippedRecommendations).toEqual([]);
  });

  it('celebrates each level once', () => {
    const p = markLevelCelebrated(createEmptyProgress(NOW), 3);
    expect(p.lastCelebratedLevel).toBe(3);
    expect(markLevelCelebrated(p, 2)).toBe(p);
  });

  it('summarizes progress for the profile and import preview', () => {
    let p = recordPass(createEmptyProgress(NOW), lesson, 'a', 10, NOW).progress;
    p = recordPass(p, lesson, 'b', 10, NOW).progress;
    expect(summarize(p, '2026-10-06')).toEqual({
      xp: 50,
      level: 1,
      lessonsCompleted: 1,
      lessonsStarted: 1,
      challengesPassed: 2,
      currentStreak: 1,
      longestStreak: 1,
    });
  });
});
