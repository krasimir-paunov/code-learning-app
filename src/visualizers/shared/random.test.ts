import { describe, expect, it } from 'vitest';
import { seeded, shuffledRange } from './random.ts';

describe('random helpers', () => {
  it('is reproducible per seed and stays in [0, 1)', () => {
    const a = seeded(5);
    const b = seeded(5);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('shuffles a permutation of 1..n', () => {
    const out = shuffledRange(50, seeded(1));
    expect([...out].sort((x, y) => x - y)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(out).not.toEqual([...out].sort((x, y) => x - y));
  });
});
