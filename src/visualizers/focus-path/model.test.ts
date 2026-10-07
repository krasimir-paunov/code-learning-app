import { describe, expect, it } from 'vitest';
import { backwardSteps, tabOrder } from './model.ts';

describe('tabOrder', () => {
  it('follows document order for natural focusables', () => {
    expect(tabOrder([0, 1, 2].map((index) => ({ index, tabIndex: 0 })))).toEqual([0, 1, 2]);
  });

  it('puts positive tabindex first, lowest number first', () => {
    expect(
      tabOrder([
        { index: 0, tabIndex: 0 },
        { index: 1, tabIndex: 2 },
        { index: 2, tabIndex: 1 },
        { index: 3, tabIndex: 0 },
      ]),
    ).toEqual([2, 1, 0, 3]);
  });

  it('never reaches tabindex -1, disabled or hidden elements', () => {
    expect(
      tabOrder([
        { index: 0, tabIndex: -1 },
        { index: 1, tabIndex: 0, skipped: true },
        { index: 2, tabIndex: 0 },
      ]),
    ).toEqual([2]);
  });
});

describe('backwardSteps', () => {
  it('flags steps that jump up or back along a line', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 100, y: 10 },
      { x: 50, y: 10 },
      { x: 10, y: 60 },
      { x: 10, y: 10 },
    ];
    expect(backwardSteps(points)).toEqual([2, 4]);
  });
});
