import { defineChallengeType, type GradeResult } from '../../contract.ts';
import { normalizeAnswer } from '../../shared/normalize.ts';

/** A highlighted code line: HTML pieces interleaved with blanks. */
export type Segment = { html: string } | { blank: string };

export interface BlankSpec {
  name: string;
  /** Accessible label, e.g. "Blank 1 of 2: content width". */
  label: string;
  accept: string[];
  caseSensitive: boolean;
  /** Input width in characters. */
  size: number;
}

export interface FillBlankSpec {
  lines: Segment[][];
  blanks: BlankSpec[];
}

/** Blank name → typed value. */
export type FillBlankAnswer = Record<string, string>;

export function gradeFillBlank(spec: FillBlankSpec, answer: FillBlankAnswer): GradeResult {
  if (spec.blanks.some((b) => !(answer[b.name] ?? '').trim())) {
    return { passed: false, partial: true, feedback: 'Fill every blank first.' };
  }
  const details = spec.blanks.map((blank) => {
    const given = normalizeAnswer(answer[blank.name] ?? '', blank.caseSensitive);
    const passed = blank.accept.some((a) => normalizeAnswer(a, blank.caseSensitive) === given);
    return { label: blank.label, passed };
  });
  const wrong = spec.blanks.filter((_, i) => !details[i]?.passed).map((b) => b.name);
  if (wrong.length === 0) return { passed: true, feedback: 'Every blank is right.', details };
  const right = spec.blanks.length - wrong.length;
  return {
    passed: false,
    feedback:
      spec.blanks.length === 1
        ? 'Not quite. Check the highlighted blank.'
        : `${right} of ${spec.blanks.length} blanks are right. Fix the highlighted ${wrong.length === 1 ? 'one' : 'ones'}.`,
    details,
    highlight: wrong,
  };
}

export default defineChallengeType<FillBlankSpec, FillBlankAnswer>({
  type: 'fill-blank',
  label: 'Fill in the blanks',
  defaultXp: 10,
  grade: gradeFillBlank,
  View: () => import('./View.tsx'),
});
