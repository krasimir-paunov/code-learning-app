import { describe, expect, it } from 'vitest';
import { applyFix } from './build.ts';
import { gradeFindBug, type FindBugSpec } from './index.ts';

const spec: FindBugSpec = {
  lines: [],
  bugLines: [4],
  fix: { kind: 'choices', choices: [{ html: 'a' }, { html: 'b' }], correct: 0 },
};

describe('find-bug grading', () => {
  it('confirms the right line without counting it as a failure', () => {
    expect(gradeFindBug(spec, { stage: 'line', lines: [4] })).toMatchObject({
      passed: false,
      partial: true,
      feedback: 'Right line. Now choose the fix.',
    });
  });

  it('names the wrong line', () => {
    expect(gradeFindBug(spec, { stage: 'line', lines: [3] })).toMatchObject({
      passed: false,
      feedback: 'The bug is not on line 3.',
      highlight: { wrongLines: [3] },
    });
  });

  it('passes only with the right line and the right fix', () => {
    expect(gradeFindBug(spec, { stage: 'fix', lines: [4], fix: 0 }).passed).toBe(true);
    expect(gradeFindBug(spec, { stage: 'fix', lines: [4], fix: 1 }).passed).toBe(false);
    expect(gradeFindBug(spec, { stage: 'fix', lines: [5], fix: 0 }).passed).toBe(false);
  });

  it('accepts typed fixes, ignoring extra whitespace', () => {
    const typed: FindBugSpec = { ...spec, fix: { kind: 'accept', accept: ['while (lo <= hi) {'] } };
    expect(
      gradeFindBug(typed, { stage: 'fix', lines: [4], fix: '  while (lo <= hi)  {' }).passed,
    ).toBe(true);
  });

  it('asks for every line of a multi-line bug', () => {
    const multi = { ...spec, bugLines: [2, 3] };
    expect(gradeFindBug(multi, { stage: 'line', lines: [2] }).feedback).toBe(
      'Close: the bug spans 2 lines. Select all of them.',
    );
  });
});

describe('applyFix', () => {
  it('replaces the bug line, keeping its indentation', () => {
    const code = 'function f() {\n  while (lo < hi) {\n  }\n}';
    expect(applyFix(code, [2], 'while (lo <= hi) {')).toBe(
      'function f() {\n  while (lo <= hi) {\n  }\n}',
    );
  });
});
