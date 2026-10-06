import { describe, expect, it } from 'vitest';
import { binarySearch, linearSearch } from './algorithms/searching.ts';
import { SORT_COMPLEXITY, SORTS, type SortAlgorithm } from './algorithms/sorting.ts';
import {
  allFrames,
  raceFrames,
  raceLength,
  raceStandings,
  TraceCursor,
  type Frame,
} from './trace.ts';

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomArray(n: number, random: () => number, max = 50) {
  return Array.from({ length: n }, () => 1 + Math.floor(random() * max));
}

const probes = (frames: Frame[]) =>
  frames.filter((f) => f.activeKind === 'probe').map((f) => f.active[0]);

describe('TraceCursor', () => {
  const input = [5, 3, 8, 1, 9, 2, 7];

  it('reconstructs the same frames regardless of checkpoint spacing', () => {
    const dense = new TraceCursor(input, SORTS.quick, 1);
    const sparse = new TraceCursor(input, SORTS.quick, 1000);
    const normal = new TraceCursor(input, SORTS.quick);
    expect(dense.length).toBe(sparse.length);
    for (let i = 0; i <= dense.length; i += 1) {
      expect(sparse.frame(i)).toEqual(dense.frame(i));
      expect(normal.frame(i)).toEqual(dense.frame(i));
    }
  });

  it('starts from the untouched input and clamps past the end', () => {
    const cursor = new TraceCursor(input, SORTS.bubble);
    expect(cursor.frame(0)).toMatchObject({ index: 0, array: input, note: 'Start' });
    const end = cursor.frame(cursor.length);
    expect(cursor.frame(cursor.length + 50)).toEqual(end);
    expect(cursor.frame(-3).index).toBe(0);
  });

  it('pulls steps lazily (a race never computes more than it shows)', () => {
    const cursor = new TraceCursor(randomArray(200, seeded(1)), SORTS.bubble);
    cursor.frame(10);
    expect(cursor.recorded).toBe(10);
    expect(cursor.done).toBe(false);
    cursor.frame(5); // stepping back does not pull more
    expect(cursor.recorded).toBe(10);
  });

  it('can step backward to an earlier state exactly', () => {
    const cursor = new TraceCursor(input, SORTS.merge, 4);
    const forward = allFrames(cursor);
    for (let i = forward.length - 1; i >= 0; i--) expect(cursor.frame(i)).toEqual(forward[i]);
  });
});

describe('sorting generators', () => {
  const algorithms = Object.keys(SORTS) as SortAlgorithm[];
  const random = seeded(42);
  const cases = [
    [],
    [1],
    [2, 1],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [3, 1, 3, 2, 1, 3],
    ...Array.from({ length: 20 }, (_, n) => randomArray(n + 3, random, 10)),
    randomArray(120, random, 1000),
  ];

  it.each(algorithms)('%s sorts every case, and its events replay to the same result', (name) => {
    for (const input of cases) {
      const cursor = new TraceCursor(input, SORTS[name]);
      const expected = [...input].sort((a, b) => a - b);
      expect(cursor.result).toEqual(expected);
      const last = cursor.frame(cursor.length);
      expect(last.array).toEqual(expected);
      expect(last.marks.every((m) => m === 'sorted')).toBe(true);
    }
  });

  it('counts real operations: bubble on sorted input is one pass, no swaps', () => {
    const c = new TraceCursor([1, 2, 3, 4, 5, 6], SORTS.bubble);
    expect(c.frame(c.length).counters).toMatchObject({ comparisons: 5, swaps: 0 });
  });

  it('counts real operations: insertion on reversed input swaps n(n-1)/2 times', () => {
    const n = 10;
    const reversed = Array.from({ length: n }, (_, i) => n - i);
    const c = new TraceCursor(reversed, SORTS.insertion);
    expect(c.frame(c.length).counters.swaps).toBe((n * (n - 1)) / 2);
  });

  it('merge sort writes n·log2(n) times on a power-of-two input', () => {
    const c = new TraceCursor(randomArray(64, seeded(7)), SORTS.merge);
    expect(c.frame(c.length).counters.writes).toBe(64 * 6);
  });

  it('labels complexity for the race', () => {
    expect(SORT_COMPLEXITY.quick.worst).toBe('O(n²)');
    expect(SORT_COMPLEXITY.merge.stable).toBe(true);
  });
});

describe('search generators', () => {
  const xs = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

  it('binary search probes 4, 7, 5 for 23 (the documented example)', () => {
    const cursor = new TraceCursor(xs, (a) => binarySearch(a, 23));
    expect(probes(allFrames(cursor))).toEqual([4, 7, 5]);
    expect(cursor.result).toBe(5);
    expect(cursor.frame(cursor.length).pointers).toEqual({ lo: 5, mid: 5, hi: 6 });
  });

  it('returns -1 for missing values and says so', () => {
    const cursor = new TraceCursor(xs, (a) => binarySearch(a, 24));
    expect(cursor.result).toBe(-1);
    expect(cursor.frame(cursor.length).note).toContain('not found (-1)');
  });

  it('agrees with indexOf, and binary search never needs more than ⌊log2 n⌋ + 1 checks', () => {
    for (let n = 0; n <= 64; n++) {
      const sorted = Array.from({ length: n }, (_, i) => i * 2);
      for (let target = -1; target <= n * 2; target++) {
        const bin = new TraceCursor(sorted, (a) => binarySearch(a, target));
        const lin = new TraceCursor(sorted, (a) => linearSearch(a, target));
        expect(bin.result).toBe(sorted.indexOf(target));
        expect(lin.result).toBe(sorted.indexOf(target));
        expect(bin.length).toBeLessThanOrEqual(n === 0 ? 0 : Math.floor(Math.log2(n)) + 1);
      }
    }
  });

  it('binary search on 1,024 items needs at most 11 checks; linear may need all 1,024', () => {
    const big = Array.from({ length: 1024 }, (_, i) => i);
    const worstBinary = Math.max(
      ...big.map((t) => new TraceCursor(big, (a) => binarySearch(a, t)).length),
    );
    expect(worstBinary).toBe(11);
    expect(new TraceCursor(big, (a) => linearSearch(a, 1023)).length).toBe(1024);
  });
});

describe('race', () => {
  it('advances lanes in lockstep, holds finished lanes and ranks by steps', () => {
    const xs = Array.from({ length: 32 }, (_, i) => i * 3);
    const race = {
      lanes: [
        new TraceCursor(xs, (a) => linearSearch(a, 90)),
        new TraceCursor(xs, (a) => binarySearch(a, 90)),
      ],
    };
    expect(raceLength(race)).toBe(31);
    const [linear, binary] = raceFrames(race, 20);
    expect(linear?.index).toBe(20);
    expect(binary?.index).toBe(race.lanes[1]?.length);
    expect(raceStandings(race)[0]?.lane).toBe(1);
  });
});
