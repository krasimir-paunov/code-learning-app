import type { Page } from '@playwright/test';

export const PROGRESS_KEY = 'pneon.progress';

/** A realistic saved profile: one completed lesson, a skipped recommendation, two active days. */
export function sampleProgress() {
  return {
    schemaVersion: 1,
    createdAt: '2026-09-30T08:00:00.000Z',
    lessons: {
      'css.box-model': {
        startedAt: '2026-10-01T09:00:00.000Z',
        completedAt: '2026-10-01T09:08:00.000Z',
        contentVersion: 1,
        completionXp: 20,
        challenges: {
          'match-card': {
            attempts: 1,
            hintsUsed: 0,
            revealed: false,
            passedAt: '2026-10-01T09:03:00.000Z',
            xp: 30,
          },
          'content-width': {
            attempts: 2,
            hintsUsed: 1,
            revealed: false,
            passedAt: '2026-10-01T09:05:00.000Z',
            xp: 8,
          },
        },
      },
    },
    activity: { '2026-10-01': { xp: 58, passed: 2 }, '2026-10-02': { xp: 15, passed: 1 } },
    lastCelebratedLevel: 1,
    skippedRecommendations: ['cs'],
    settings: { freeRoam: false, effects: 'system', preferredCodeTab: 'js', editorFontSize: 15 },
  };
}

/** Seeds localStorage before any app script runs (only on the first navigation). */
export async function seedProgress(page: Page, progress: unknown) {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('seeded', '1');
      }
    },
    [PROGRESS_KEY, JSON.stringify(progress)] as const,
  );
}

/** Empty progress with Free roam on: opens fixture lessons regardless of their prerequisites. */
export function freeRoamProgress() {
  return {
    ...sampleProgress(),
    lessons: {},
    activity: {},
    skippedRecommendations: [],
    settings: { ...sampleProgress().settings, freeRoam: true },
  };
}
