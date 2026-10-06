import { describe, expect, it } from 'vitest';
import { gradeFillBlank, type FillBlankSpec } from './index.ts';

const spec: FillBlankSpec = {
  lines: [],
  blanks: [
    { name: 'width', label: 'Blank 1 of 2', accept: ['248px'], caseSensitive: true, size: 7 },
    {
      name: 'sizing',
      label: 'Blank 2 of 2',
      accept: ['border-box'],
      caseSensitive: false,
      size: 12,
    },
  ],
};

describe('fill-blank grading', () => {
  it('passes when every blank matches an accepted value (whitespace-insensitive)', () => {
    expect(gradeFillBlank(spec, { width: ' 248px ', sizing: 'Border-Box' }).passed).toBe(true);
  });

  it('respects case sensitivity per blank', () => {
    expect(gradeFillBlank(spec, { width: '248PX', sizing: 'border-box' }).passed).toBe(false);
  });

  it('reports which blanks are wrong', () => {
    const result = gradeFillBlank(spec, { width: '300px', sizing: 'border-box' });
    expect(result).toMatchObject({
      passed: false,
      feedback: '1 of 2 blanks are right. Fix the highlighted one.',
      highlight: ['width'],
    });
    expect(result.details?.map((d) => d.passed)).toEqual([false, true]);
  });

  it('does not count a submission with empty blanks', () => {
    expect(gradeFillBlank(spec, { width: '248px' })).toMatchObject({
      passed: false,
      partial: true,
    });
  });
});
