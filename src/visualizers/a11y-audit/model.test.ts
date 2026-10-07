import { describe, expect, it } from 'vitest';
import { backgroundOf, parseRgb, textContrast } from './model.ts';

describe('parseRgb', () => {
  it('reads computed colours', () => {
    expect(parseRgb('rgb(99, 99, 99)')).toEqual({ r: 99, g: 99, b: 99, alpha: 1 });
    expect(parseRgb('rgba(0, 0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0, alpha: 0 });
    expect(parseRgb('oklch(0.5 0 0)')).toBeNull();
  });
});

describe('backgroundOf', () => {
  it('skips transparent layers up to the first opaque one', () => {
    expect(backgroundOf(['rgba(0, 0, 0, 0)', 'rgb(17, 24, 39)', 'rgb(255, 255, 255)'])).toEqual({
      r: 17,
      g: 24,
      b: 39,
      alpha: 1,
    });
  });
});

describe('textContrast', () => {
  it('measures text against the background it sits on', () => {
    expect(
      textContrast('rgb(119, 119, 119)', ['rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)']),
    ).toBeCloseTo(4.48, 2);
  });
});
