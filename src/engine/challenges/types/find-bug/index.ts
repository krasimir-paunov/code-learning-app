import { defineChallengeType, type GradeResult } from '../../contract.ts';
import { normalizeAnswer, sameSet } from '../../shared/normalize.ts';

export interface FindBugSpec {
  /** Highlighted HTML, one entry per source line (line numbers are 1-based indexes + 1). */
  lines: string[];
  bugLines: number[];
  fix:
    | { kind: 'choices'; choices: { html: string }[]; correct: number }
    | { kind: 'accept'; accept: string[] };
}

export type FindBugAnswer =
  { stage: 'line'; lines: number[] } | { stage: 'fix'; lines: number[]; fix: number | string };

const plural = (n: number) => (n === 1 ? 'line' : 'lines');

export function gradeFindBug(spec: FindBugSpec, answer: FindBugAnswer): GradeResult {
  if (answer.lines.length === 0) {
    return { passed: false, partial: true, feedback: 'Click the line with the bug first.' };
  }
  if (!sameSet(answer.lines, spec.bugLines)) {
    const wrong = answer.lines.filter((l) => !spec.bugLines.includes(l));
    const feedback =
      wrong.length > 0
        ? `The bug is not on ${plural(wrong.length)} ${wrong.join(', ')}.`
        : `Close: the bug spans ${spec.bugLines.length} ${plural(spec.bugLines.length)}. Select all of them.`;
    return { passed: false, feedback, highlight: { wrongLines: wrong } };
  }
  if (answer.stage === 'line') {
    return { passed: false, partial: true, feedback: 'Right line. Now choose the fix.' };
  }
  const fixed =
    spec.fix.kind === 'choices'
      ? answer.fix === spec.fix.correct
      : spec.fix.accept.some(
          (a) => normalizeAnswer(a, true) === normalizeAnswer(String(answer.fix), true),
        );
  return fixed
    ? { passed: true, feedback: 'Bug found and fixed.' }
    : {
        passed: false,
        feedback: 'Right line, but that change does not fix it. Think about the case that fails.',
      };
}

export default defineChallengeType<FindBugSpec, FindBugAnswer>({
  type: 'find-bug',
  label: 'Find the bug',
  defaultXp: 15,
  grade: gradeFindBug,
  View: () => import('./View.tsx'),
});
