import { describe, expect, it } from 'vitest';
import { filmstrip, PRESETS, progressAt, toCss, type Curve } from './model.ts';

const times = [0.1, 0.25, 0.5, 0.75, 0.9];
const sample = (curve: Curve) => times.map((t) => progressAt(curve, t));

// Expected values are Chromium's, sampled with element.animate() at the same moments.
const chromium: Record<string, number[]> = {
  ease: [0.0947963, 0.408511, 0.802403, 0.960459, 0.994316],
  'ease-in': [0.0170266, 0.0934647, 0.315357, 0.621862, 0.839428],
  'ease-out': [0.160572, 0.378138, 0.684643, 0.906535, 0.982973],
  'ease-in-out': [0.0197225, 0.129162, 0.5, 0.870838, 0.980278],
};

describe('progressAt', () => {
  it('matches Chromium for every keyword', () => {
    for (const [name, expected] of Object.entries(chromium)) {
      const curve = PRESETS[name];
      if (!curve) throw new Error(name);
      sample(curve).forEach((value, i) => expect(value).toBeCloseTo(expected[i] ?? 0, 3));
    }
  });

  it('can overshoot, like a "back" curve', () => {
    expect(progressAt([0.34, 1.56, 0.64, 1], 0.5)).toBeCloseTo(1.0874, 3);
  });

  it('starts at 0 and ends at 1', () => {
    expect([
      progressAt(PRESETS.ease ?? [0, 0, 1, 1], 0),
      progressAt([0.34, 1.56, 0.64, 1], 1),
    ]).toEqual([0, 1]);
  });
});

describe('toCss', () => {
  it('prefers the keyword', () => {
    expect(toCss([0, 0, 0.58, 1])).toBe('ease-out');
    expect(toCss([0.34, 1.56, 0.64, 1])).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
  });
});

describe('filmstrip', () => {
  it('samples evenly from start to end', () => {
    const strip = filmstrip([0, 0, 1, 1], 5);
    [0, 0.25, 0.5, 0.75, 1].forEach((expected, i) => expect(strip[i]).toBeCloseTo(expected, 6));
  });
});
