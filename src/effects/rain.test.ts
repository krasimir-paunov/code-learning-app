import { describe, expect, it } from 'vitest';
import { createRain, RAIN_TOKENS, staticRain, stepRain } from './rain.ts';

/** Deterministic PRNG (mulberry32) so the tests are stable. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const allChars = new Set(RAIN_TOKENS.join(''));

describe('digital rain model', () => {
  it('only draws characters taken from code tokens, inside the grid', () => {
    const random = seeded(1);
    const state = createRain(40, 20, random);
    for (let i = 0; i < 200; i++) {
      for (const glyph of stepRain(state, 20, random)) {
        expect(allChars.has(glyph.char)).toBe(true);
        expect(glyph.column).toBeGreaterThanOrEqual(0);
        expect(glyph.column).toBeLessThan(40);
        expect(glyph.row).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps every column falling forever (columns recycle to the top)', () => {
    const random = seeded(2);
    const state = createRain(10, 15, random);
    let drawn = 0;
    for (let i = 0; i < 1000; i++) drawn += stepRain(state, 15, random).length;
    // Each column moves at least every third tick and recycles, so the screen never empties.
    expect(drawn).toBeGreaterThan(1000);
    for (const column of state) expect(column.row).toBeLessThanOrEqual(15 * 1.5 + 1);
  });

  it('produces a still field within the grid for reduced effects', () => {
    const glyphs = staticRain(30, 12, seeded(3));
    expect(glyphs.length).toBeGreaterThan(0);
    for (const glyph of glyphs) expect(glyph.row).toBeLessThan(12);
  });
});
