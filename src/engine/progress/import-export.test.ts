import { describe, expect, it } from 'vitest';
import { recordHint, recordPass, skipRecommendations, type LessonRef } from './actions.ts';
import {
  createExport,
  EXPORT_FORMAT,
  exportFileName,
  mergeProgress,
  parseBackup,
} from './import-export.ts';
import { migrate, type Migration } from './migrations/index.ts';
import { createEmptyProgress, type Progress } from './schema.ts';

const NOW = new Date('2026-10-06T10:00:00Z');
const lesson = (id: string, challengeIds = ['a']): LessonRef => ({
  id,
  version: 1,
  challengeIds,
  boss: false,
});

function sample(): Progress {
  let p = createEmptyProgress(NOW);
  p = recordPass(p, lesson('css.box-model', ['a', 'b']), 'a', 10, NOW).progress;
  p = recordPass(p, lesson('css.box-model', ['a', 'b']), 'b', 20, NOW).progress;
  return skipRecommendations(p, 'cs');
}

describe('export / import', () => {
  it('round-trips exactly through the export envelope', () => {
    const progress = sample();
    const text = JSON.stringify(createExport(progress, NOW));
    const result = parseBackup(text);
    expect(result).toEqual({ ok: true, progress });
  });

  it('names the file after the app and the local date', () => {
    expect(exportFileName(new Date(2026, 9, 6))).toMatch(/^[a-z0-9-]+-progress-2026-10-06\.json$/);
  });

  it.each([
    ['not json', '{oops', 'not valid JSON'],
    ['an array', '[]', 'not a progress backup'],
    ['another format', JSON.stringify({ format: 'other' }), 'not a progress backup from this app'],
    ['a missing payload', JSON.stringify({ format: EXPORT_FORMAT }), 'no progress data'],
  ])('rejects %s with a specific message', (_, text, message) => {
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });

  it('rejects damaged data and says where', () => {
    const envelope = createExport(sample(), NOW);
    const broken = JSON.parse(JSON.stringify(envelope));
    broken.progress.lessons['css.box-model'].challenges.a.xp = 'lots';
    const result = parseBackup(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('lessons.css.box-model.challenges.a.xp');
  });

  it('rejects data from a newer schema instead of guessing', () => {
    const envelope = createExport(sample(), NOW);
    const future = { ...envelope, progress: { ...envelope.progress, schemaVersion: 99 } };
    const result = parseBackup(JSON.stringify(future));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('newer version');
  });
});

describe('mergeProgress', () => {
  it('unions lessons, keeps the earliest pass and the higher XP per challenge', () => {
    const early = new Date('2026-10-01T09:00:00Z');
    const late = new Date('2026-10-05T09:00:00Z');
    const ref = lesson('algo.binary-search', ['a', 'b']);
    // Device A passed "a" late with a hint (less XP); device B passed "a" early first try.
    const a = recordPass(
      recordHint(createEmptyProgress(late), ref, 'a', late),
      ref,
      'a',
      10,
      late,
    ).progress;
    let b = recordPass(createEmptyProgress(early), ref, 'a', 10, early).progress;
    b = recordPass(b, lesson('css.box-model'), 'a', 10, early).progress;

    const merged = mergeProgress(a, b);
    expect(merged.lessons[ref.id]?.challenges.a).toMatchObject({
      passedAt: early.toISOString(),
      xp: 15,
      hintsUsed: 1,
    });
    expect(merged.lessons[ref.id]?.startedAt).toBe(early.toISOString());
    expect(Object.keys(merged.lessons).sort()).toEqual(['algo.binary-search', 'css.box-model']);
    expect(Object.keys(merged.activity).sort()).toEqual(['2026-10-01', '2026-10-05']);
  });

  it('never double-counts the same day and keeps local settings', () => {
    const a = { ...sample(), settings: { ...sample().settings, freeRoam: true } };
    const merged = mergeProgress(a, sample());
    expect(merged.activity['2026-10-06']).toEqual(sample().activity['2026-10-06']);
    expect(merged.settings.freeRoam).toBe(true);
    expect(merged.skippedRecommendations).toEqual(['cs']);
  });

  it('is idempotent', () => {
    const p = sample();
    expect(mergeProgress(p, p)).toEqual(p);
  });
});

describe('migrate', () => {
  it('upgrades step by step through registered migrations, then validates', () => {
    const { lastCelebratedLevel, ...v1 } = sample();
    // Fixture: a hypothetical schema 0 that stored the celebrated level under another name.
    const v0 = { ...v1, schemaVersion: 0, celebrated: lastCelebratedLevel };
    const migrations: Record<number, Migration> = {
      0: ({ celebrated, ...rest }) => ({ ...rest, lastCelebratedLevel: celebrated }),
    };
    expect(migrate(v0, migrations)).toEqual({ ok: true, progress: sample() });
  });

  it('fails clearly when a migration step is missing', () => {
    const result = migrate({ ...sample(), schemaVersion: 0 }, {});
    expect(result).toEqual({ ok: false, error: 'No migration from schema 0.' });
  });

  it('accepts current data unchanged', () => {
    const p = sample();
    expect(migrate(JSON.parse(JSON.stringify(p)))).toEqual({ ok: true, progress: p });
  });
});
