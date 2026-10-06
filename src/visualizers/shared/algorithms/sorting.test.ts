import { describe, expect, it } from 'vitest';
import { seeded, shuffledRange } from '../random.ts';
import { allFrames, TraceCursor, type Frame } from '../trace.ts';
import { heapSort, mergeSort, SORT_METRIC, SORTS, type SortAlgorithm } from './sorting.ts';

const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);

describe('merge sort', () => {
  const inputs = [
    [],
    [1],
    [2, 1],
    [5, 4, 3, 2, 1],
    [3, 1, 3, 2, 1, 3],
    shuffledRange(28, seeded(3)),
    shuffledRange(100, seeded(9)),
  ];

  it('sorts, and never swaps: its data movement is writes', () => {
    for (const input of inputs) {
      const cursor = new TraceCursor(input, mergeSort);
      const last = cursor.frame(cursor.length);
      expect(last.array).toEqual(sorted(input));
      expect(last.counters.swaps).toBe(0);
      if (input.length > 1) expect(last.counters.writes).toBeGreaterThan(0);
    }
  });

  it('writes n·log2(n) times on a power-of-two input (each element once per level)', () => {
    for (const n of [2, 8, 64]) {
      const cursor = new TraceCursor(shuffledRange(n, seeded(n)), mergeSort);
      expect(cursor.frame(cursor.length).counters.writes).toBe(n * Math.log2(n));
    }
  });

  it('compares at most n·log2(n) times', () => {
    const cursor = new TraceCursor(shuffledRange(64, seeded(5)), mergeSort);
    expect(cursor.frame(cursor.length).counters.comparisons).toBeLessThanOrEqual(64 * 6);
  });

  it('keeps every value on screen: each frame is a permutation of the input', () => {
    const input = shuffledRange(40, seeded(11));
    for (const frame of allFrames(new TraceCursor(input, mergeSort))) {
      expect(sorted([...frame.array])).toEqual(sorted(input));
    }
  });

  it('after each comparison, the smaller of the two shown values lands in the slot', () => {
    const input = [3, 1, 3, 2, 1, 3, 7, 0, 5, 5];
    const frames = allFrames(new TraceCursor(input, mergeSort));
    let checked = 0;
    frames.forEach((frame: Frame, index) => {
      if (frame.activeKind !== 'compare') return;
      const [slot = -1, right = -1] = frame.active;
      const [x, y] = [frame.array[slot] as number, frame.array[right] as number];
      const next = frames[index + 1] as Frame;
      expect(next.activeKind).toBe('write');
      expect(next.active).toEqual([slot]);
      expect(next.array[slot]).toBe(Math.min(x, y));
      checked++;
    });
    expect(checked).toBeGreaterThan(0);
  });

  it('is stable: equal values keep their original order', () => {
    // Follow each element's identity through the events: a write keeps the element where it
    // stands, a move carries it to its slot.
    const keys = [2, 1, 2, 1, 2, 0, 1];
    const ids = keys.map((_, i) => i);
    for (const step of mergeSort([...keys])) {
      for (const event of step.events) {
        if (event.type === 'move') ids.splice(event.to, 0, ...ids.splice(event.from, 1));
      }
    }
    expect(ids.map((id) => keys[id])).toEqual(sorted(keys));
    for (let i = 1; i < ids.length; i++) {
      const [before, after] = [ids[i - 1] as number, ids[i] as number];
      if (keys[before] === keys[after]) expect(before).toBeLessThan(after);
    }
  });
});

describe('SORT_METRIC', () => {
  it('names a counter each algorithm actually moves data with', () => {
    const input = shuffledRange(30, seeded(2));
    for (const name of Object.keys(SORTS) as SortAlgorithm[]) {
      const cursor = new TraceCursor(input, SORTS[name]);
      const { counters } = cursor.frame(cursor.length);
      expect(counters[SORT_METRIC[name]]).toBeGreaterThan(0);
      const other = SORT_METRIC[name] === 'swaps' ? 'writes' : 'swaps';
      expect(counters[other]).toBe(0);
    }
  });
});

describe('heap sort', () => {
  it('moves the largest unsorted value to the end on every pass', () => {
    const input = shuffledRange(31, seeded(4));
    const frames = allFrames(new TraceCursor(input, heapSort));
    const passes = frames.filter((f) => f.note.startsWith('Move the largest'));
    expect(passes).toHaveLength(input.length - 1);
    for (const frame of passes) {
      const end = frame.active[1] as number;
      expect(frame.array[end]).toBe(Math.max(...frame.array.slice(0, end + 1)));
      expect(frame.marks[end]).toBe('sorted');
    }
  });

  it('stays O(n log n) even on input that is already sorted or reversed', () => {
    const n = 64;
    const ascending = Array.from({ length: n }, (_, i) => i);
    for (const input of [ascending, [...ascending].reverse(), shuffledRange(n, seeded(8))]) {
      const cursor = new TraceCursor(input, heapSort);
      const { comparisons, swaps } = cursor.frame(cursor.length).counters;
      expect(comparisons).toBeLessThanOrEqual(2 * n * Math.log2(n));
      expect(swaps).toBeLessThanOrEqual(n * Math.log2(n) + n);
    }
  });
});
