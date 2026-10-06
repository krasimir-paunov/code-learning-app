import type { Complexity, StepGenerator } from '../trace.ts';

/**
 * Reference code shown next to binary search in the step tracer; `line` in each step points
 * into it. It is the same function as the lesson's verified snippet.
 */
export const BINARY_SEARCH_CODE = `function binarySearch(xs, target) {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xs[mid] === target) return mid;
    if (xs[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

export const LINEAR_SEARCH_CODE = `function linearSearch(xs, target) {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === target) return i;
  }
  return -1;
}`;

export const SEARCH_COMPLEXITY: Record<'linear' | 'binary', Complexity> = {
  linear: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  binary: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
};

/** One step per element checked (a "probe"). Returns the index or -1. */
export function* linearSearch(xs: number[], target: number): StepGenerator<number> {
  for (let i = 0; i < xs.length; i++) {
    const value = xs[i] as number;
    const found = value === target;
    const last = i === xs.length - 1;
    yield {
      events: [
        { type: 'pointers', values: { i } },
        { type: 'probe', i },
        { type: 'mark', indices: [i], as: found ? 'found' : 'discarded' },
      ],
      note: found
        ? `Check index ${i}: ${value} is ${target}. Found after ${i + 1} checks.`
        : `Check index ${i}: ${value} is not ${target}.${last ? ` Not in the array: -1 after ${xs.length} checks.` : ''}`,
      line: 3,
      vars: { i, 'xs[i]': value },
    };
    if (found) return i;
  }
  return -1;
}

/** One step per probe of the middle element; discarded halves are marked. */
export function* binarySearch(xs: number[], target: number): StepGenerator<number> {
  let lo = 0;
  let hi = xs.length - 1;
  let checks = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = xs[mid] as number;
    checks++;
    const pointers = { type: 'pointers', values: { lo, mid, hi } } as const;
    const vars = { lo, mid, hi, 'xs[mid]': value };
    if (value === target) {
      yield {
        events: [
          pointers,
          { type: 'probe', i: mid },
          { type: 'mark', indices: [mid], as: 'found' },
        ],
        note: `Check the middle, index ${mid}: ${value} is ${target}. Found in ${checks} checks.`,
        line: 6,
        vars,
      };
      return mid;
    }
    const discarded: number[] = [];
    if (value < target) {
      for (let i = lo; i <= mid; i++) discarded.push(i);
      lo = mid + 1;
    } else {
      for (let i = mid; i <= hi; i++) discarded.push(i);
      hi = mid - 1;
    }
    const empty = lo > hi;
    const why =
      value < target
        ? `${value} < ${target}, so drop the left half (lo = ${lo})`
        : `${value} > ${target}, so drop the right half (hi = ${hi})`;
    yield {
      events: [
        pointers,
        { type: 'probe', i: mid },
        { type: 'mark', indices: discarded, as: 'discarded' },
      ],
      note: `Check the middle, index ${mid}: ${why}.${empty ? ` Nothing left: not found (-1) after ${checks} checks.` : ''}`,
      line: value < target ? 7 : 8,
      vars,
    };
    if (empty) break;
  }
  return -1;
}
