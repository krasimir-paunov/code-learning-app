import { defineChallengeType, type GradeResult } from '../../contract.ts';
import { sameSet } from '../../shared/normalize.ts';

export interface ChoiceSpec {
  options: { html: string; whyHtml: string }[];
  multiple: boolean;
  correct: number[];
}

/** Indices of the selected options. */
export type ChoiceAnswer = number[];

export function gradeChoice(spec: ChoiceSpec, answer: ChoiceAnswer): GradeResult {
  if (answer.length === 0) {
    return { passed: false, partial: true, feedback: 'Choose an answer first.' };
  }
  if (sameSet(answer, spec.correct)) {
    return { passed: true, feedback: 'Correct.', highlight: answer };
  }
  if (!spec.multiple) {
    return {
      passed: false,
      feedback: 'Not that one. Read why below, then try again.',
      highlight: answer,
    };
  }
  const wrong = answer.filter((i) => !spec.correct.includes(i)).length;
  const missing = spec.correct.filter((i) => !answer.includes(i)).length;
  const parts = [
    wrong > 0 && `${wrong} of your choices ${wrong === 1 ? 'is' : 'are'} wrong`,
    missing > 0 && `${missing} correct ${missing === 1 ? 'option is' : 'options are'} missing`,
  ].filter(Boolean);
  return { passed: false, feedback: `Not quite: ${parts.join(' and ')}.`, highlight: answer };
}

export default defineChallengeType<ChoiceSpec, ChoiceAnswer>({
  type: 'choice',
  label: 'Choose',
  defaultXp: 5,
  grade: gradeChoice,
  View: () => import('./View.tsx'),
});
