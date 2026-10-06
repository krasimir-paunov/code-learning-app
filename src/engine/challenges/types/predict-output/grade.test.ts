import { describe, expect, it } from 'vitest';
import { gradePredictOutput, type PredictOutputSpec } from './index.ts';

const spec: PredictOutputSpec = { code: { tabs: [] }, answer: '3 2 1' };
const twoLines: PredictOutputSpec = { code: { tabs: [] }, answer: '5\n-1' };

describe('predict-output grading', () => {
  it('ignores line endings, trailing whitespace and repeated spaces', () => {
    expect(gradePredictOutput(spec, '3 2 1').passed).toBe(true);
    expect(gradePredictOutput(spec, '  3  2 1 \r\n').passed).toBe(true);
    expect(gradePredictOutput(twoLines, '5\r\n-1\n\n').passed).toBe(true);
  });

  it('is otherwise exact', () => {
    expect(gradePredictOutput(spec, '3 2 0').passed).toBe(false);
    expect(gradePredictOutput(spec, '3,2,1').passed).toBe(false);
  });

  it('points out a wrong number of lines', () => {
    expect(gradePredictOutput(twoLines, '5').feedback).toBe(
      'Not quite. The program prints 2 lines; your answer has 1.',
    );
  });

  it('does not count an empty answer', () => {
    expect(gradePredictOutput(spec, '   ')).toMatchObject({ passed: false, partial: true });
  });
});
