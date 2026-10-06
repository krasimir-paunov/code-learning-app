import { describe, expect, it } from 'vitest';
import { probeSteps, raceInput } from './model.ts';

describe('search-race model', () => {
  it('builds sorted inputs with a present or missing target', () => {
    for (let seed = 0; seed < 50; seed++) {
      const present = raceInput(32, 'present', seed);
      expect(present.array).toEqual([...present.array].sort((a, b) => a - b));
      expect(present.array).toContain(present.target);
      const missing = raceInput(32, 'missing', seed);
      expect(missing.array).not.toContain(missing.target);
    }
  });

  it('is reproducible for a seed', () => {
    expect(raceInput(64, 'present', 7)).toEqual(raceInput(64, 'present', 7));
  });

  it('lists the probes of each algorithm (the trace-challenge steps)', () => {
    const xs = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
    expect(probeSteps('binary', xs, 23)).toEqual([4, 7, 5]);
    expect(probeSteps('linear', xs, 23)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(probeSteps('binary', xs, 4)).toEqual([4, 1, 0]);
  });
});
