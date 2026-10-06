import { describe, expect, it } from 'vitest';
import { gradeChoice, type ChoiceSpec } from './index.ts';

const single: ChoiceSpec = {
  options: [
    { html: 'a', whyHtml: '' },
    { html: 'b', whyHtml: '' },
    { html: 'c', whyHtml: '' },
  ],
  multiple: false,
  correct: [1],
};
const multi: ChoiceSpec = { ...single, multiple: true, correct: [0, 2] };

describe('choice grading', () => {
  it('passes the exact correct set only', () => {
    expect(gradeChoice(single, [1]).passed).toBe(true);
    expect(gradeChoice(single, [0]).passed).toBe(false);
    expect(gradeChoice(multi, [2, 0]).passed).toBe(true);
    expect(gradeChoice(multi, [0]).passed).toBe(false);
  });

  it('does not count an empty submission as an attempt', () => {
    expect(gradeChoice(single, [])).toMatchObject({ passed: false, partial: true });
  });

  it('says how a multiple-choice answer is wrong without giving it away', () => {
    expect(gradeChoice(multi, [0]).feedback).toBe('Not quite: 1 correct option is missing.');
    expect(gradeChoice(multi, [0, 1, 2]).feedback).toBe('Not quite: 1 of your choices is wrong.');
    expect(gradeChoice(multi, [1]).feedback).toBe(
      'Not quite: 1 of your choices is wrong and 2 correct options are missing.',
    );
  });

  it('returns the selection so the view can explain each judged option', () => {
    expect(gradeChoice(single, [2]).highlight).toEqual([2]);
  });
});
