import { describe, expect, it } from 'vitest';
import { areaFrom, covers, forms, negativeLine } from './model.ts';

describe('areaFrom', () => {
  it('turns two cells, in any order, into start and end lines', () => {
    expect(areaFrom({ row: 2, col: 3 }, { row: 1, col: 2 })).toEqual({
      colStart: 2,
      colEnd: 4,
      rowStart: 1,
      rowEnd: 3,
    });
  });
});

describe('covers', () => {
  it('includes the start line and excludes the end line', () => {
    const area = areaFrom({ row: 1, col: 2 }, { row: 1, col: 3 });
    expect(covers(area, { row: 1, col: 3 })).toBe(true);
    expect(covers(area, { row: 1, col: 4 })).toBe(false);
  });
});

describe('negativeLine', () => {
  it('counts back from the last line of the explicit grid', () => {
    // 4 columns have lines 1–5; line 5 is −1 and line 4 is −2.
    expect(negativeLine(5, 4)).toBe(-1);
    expect(negativeLine(4, 4)).toBe(-2);
  });
});

describe('forms', () => {
  it('writes one placement three equivalent ways', () => {
    expect(forms(areaFrom({ row: 1, col: 2 }, { row: 2, col: 3 }), 4, 3)).toEqual({
      lines: ['2 / 4', '1 / 3'],
      span: ['2 / span 2', '1 / span 2'],
      negative: ['2 / -2', '1 / -2'],
    });
  });
});
