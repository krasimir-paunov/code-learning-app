import { describe, expect, it } from 'vitest';
import { gradeTrace, type TraceSpec } from './index.ts';

const spec: TraceSpec = { visualizer: 'search-race', props: {}, steps: [4, 7, 5] };

describe('trace grading', () => {
  it('accepts each correct step as progress, not as an attempt', () => {
    expect(gradeTrace(spec, [4])).toMatchObject({
      passed: false,
      partial: true,
      feedback: 'Step 1 is right. What comes next?',
    });
    expect(gradeTrace(spec, [4, 7])).toMatchObject({ partial: true });
  });

  it('passes when every step matches in order', () => {
    expect(gradeTrace(spec, [4, 7, 5])).toMatchObject({
      passed: true,
      feedback: 'All 3 steps, in order.',
    });
  });

  it('highlights the first wrong step and keeps the correct prefix', () => {
    expect(gradeTrace(spec, [4, 6])).toMatchObject({
      passed: false,
      feedback: 'Step 2 is not what the algorithm does next. Your first 1 step is kept.',
      highlight: { index: 1, step: 6 },
    });
  });

  it('compares structured steps by value', () => {
    const swaps: TraceSpec = { ...spec, steps: [{ swap: [0, 1] }, { swap: [1, 2] }] };
    expect(gradeTrace(swaps, [{ swap: [0, 1] }, { swap: [1, 2] }]).passed).toBe(true);
  });
});
