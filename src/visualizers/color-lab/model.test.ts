import { describe, expect, it } from 'vitest';
import {
  contrast,
  formatHsl,
  formatOklch,
  formatRatio,
  formatRgb,
  hslToRgb,
  oklchToRgb,
  rgbToOklch,
  toHex,
  verdict,
} from './model.ts';

const orange = { r: 255, g: 128, b: 0 };
const white = { r: 255, g: 255, b: 255 };
const black = { r: 0, g: 0, b: 0 };

describe('notations', () => {
  it('writes one colour four ways', () => {
    expect(toHex(orange)).toBe('#ff8000');
    expect(formatRgb(orange)).toBe('rgb(255 128 0)');
    expect(formatHsl(orange)).toBe('hsl(30 100% 50%)');
    // Chromium: oklch(0.731901 0.185829 52.9792)
    expect(formatOklch(orange)).toBe('oklch(73.2% 0.186 53)');
  });

  it('converts hsl to the same rgb as Chromium', () => {
    expect(formatRgb(hslToRgb({ h: 30, s: 100, l: 50 }))).toBe('rgb(255 128 0)');
  });

  it('matches Chromium for oklch in both directions', () => {
    // Chromium: oklch(0.54613 0.215194 262.885) for #2563eb
    expect(formatOklch({ r: 0x25, g: 0x63, b: 0xeb })).toBe('oklch(54.6% 0.215 262.9)');
    // Chromium canvas paints oklch(70% 0.15 145) as 91 182 97
    expect(formatRgb(oklchToRgb({ l: 0.7, c: 0.15, h: 145 }))).toBe('rgb(91 182 97)');
  });

  it('gives greys no chroma or hue', () => {
    expect(formatOklch({ r: 0x77, g: 0x77, b: 0x77 })).toBe('oklch(56.9% 0 0)');
  });

  it('round-trips through oklch', () => {
    expect(formatRgb(oklchToRgb(rgbToOklch(orange)))).toBe('rgb(255 128 0)');
  });
});

describe('contrast', () => {
  it('spans 1 to 21', () => {
    expect(contrast(black, white)).toBeCloseTo(21);
    expect(contrast(orange, orange)).toBe(1);
  });

  it('rounds down so a near miss never passes', () => {
    const ratio = contrast({ r: 0x77, g: 0x77, b: 0x77 }, white);
    expect(formatRatio(ratio)).toBe('4.47:1');
    expect(verdict(ratio)).toEqual({ text: false, large: true });
  });
});
