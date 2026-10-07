import { describe, expect, it } from 'vitest';
import {
  fontSizeAt,
  followsTextSize,
  parseFontSize,
  parseSum,
  type FontSizeSpec,
} from './model.ts';

const desktop = { root: 16, viewport: 1280 };

function spec(text: string): FontSizeSpec {
  const parsed = parseFontSize(text);
  if (!parsed) throw new Error(`could not parse ${text}`);
  return parsed;
}
const phone = { root: 16, viewport: 375 };

describe('parseSum', () => {
  it('reads single lengths and sums', () => {
    expect(parseSum('24px')).toEqual({ px: 24, rem: 0, vw: 0 });
    expect(parseSum('1rem + 2.5vw')).toEqual({ px: 0, rem: 1, vw: 2.5 });
    expect(parseSum('-0.5rem + 3vw')).toEqual({ px: 0, rem: -0.5, vw: 3 });
    expect(parseSum('2rem - 1vw')).toEqual({ px: 0, rem: 2, vw: -1 });
  });

  it('rejects anything else', () => {
    expect(parseSum('2em')).toBeNull();
    expect(parseSum('1rem 2vw')).toBeNull();
    expect(parseSum('')).toBeNull();
  });
});

describe('parseFontSize', () => {
  it('reads clamp() with three parts', () => {
    expect(parseFontSize('clamp(1.5rem, 1rem + 2vw, 3rem)')).toEqual({
      min: { px: 0, rem: 1.5, vw: 0 },
      preferred: { px: 0, rem: 1, vw: 2 },
      max: { px: 0, rem: 3, vw: 0 },
    });
  });

  it('rejects a clamp() with the wrong number of parts', () => {
    expect(parseFontSize('clamp(1rem, 3rem)')).toBeNull();
  });
});

describe('fontSizeAt', () => {
  const fluid = spec('clamp(1.5rem, 1rem + 2vw, 3rem)');

  it('holds the minimum on small screens', () => {
    // 16 + 7.5 = 23.5px is below 24px
    expect(fontSizeAt(fluid, phone)).toEqual({ px: 24, phase: 'min' });
  });

  it('grows with the viewport in between', () => {
    expect(fontSizeAt(fluid, { root: 16, viewport: 1000 })).toEqual({ px: 36, phase: 'fluid' });
  });

  it('stops at the maximum', () => {
    expect(fontSizeAt(fluid, { root: 16, viewport: 2000 })).toEqual({ px: 48, phase: 'max' });
  });

  it('treats sizes without vw as fixed', () => {
    expect(fontSizeAt(spec('2rem'), desktop)).toEqual({ px: 32, phase: 'fixed' });
  });
});

describe('followsTextSize', () => {
  it('knows that vw alone ignores the user', () => {
    expect(followsTextSize(spec('4vw'), desktop)).toBe('not at all');
  });

  it('knows that rem follows fully', () => {
    expect(followsTextSize(spec('2rem'), desktop)).toBe('fully');
  });

  it('sees a rem + vw mix as partly', () => {
    expect(
      followsTextSize(spec('clamp(1.5rem, 1rem + 2vw, 3rem)'), {
        root: 16,
        viewport: 1000,
      }),
    ).toBe('partly');
  });
});
