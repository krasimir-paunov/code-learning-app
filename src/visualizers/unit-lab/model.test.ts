import { describe, expect, it } from 'vitest';
import { nestedSizes, toPx, type Context } from './model.ts';

const ctx: Context = {
  rootFont: 16,
  font: 20,
  parentWidth: 500,
  viewportWidth: 1200,
  zeroWidth: 10,
};

describe('toPx', () => {
  it.each([
    [{ value: 240, unit: 'px' }, 240],
    [{ value: 15, unit: 'rem' }, 240],
    [{ value: 12, unit: 'em' }, 240],
    [{ value: 50, unit: '%' }, 250],
    [{ value: 30, unit: 'ch' }, 300],
    [{ value: 25, unit: 'vw' }, 300],
  ] as const)('%j → %d', (length, px) => {
    expect(toPx(length, ctx)).toBe(px);
  });

  it('rem follows the user’s text size; px does not', () => {
    const larger = { ...ctx, rootFont: 24 };
    expect(toPx({ value: 15, unit: 'rem' }, larger)).toBe(360);
    expect(toPx({ value: 240, unit: 'px' }, larger)).toBe(240);
  });
});

describe('nestedSizes', () => {
  it('em compounds down the tree; rem does not', () => {
    expect(nestedSizes(0.8, 'em', 3, 16).map((n) => +n.toFixed(2))).toEqual([12.8, 10.24, 8.19]);
    expect(nestedSizes(0.8, 'rem', 3, 16)).toEqual([12.8, 12.8, 12.8]);
  });
});
