/**
 * Sorting step generators for the Phase 4 sort race (side-by-side algorithms, live counters).
 * Each sorts its own copy in place and narrates every comparison, swap and write, so the
 * race's counters are the algorithm's real operation counts.
 */
import type { Complexity, StepGenerator } from '../trace.ts';

export type SortAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

export const SORT_COMPLEXITY: Record<SortAlgorithm, Complexity> = {
  bubble: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  selection: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false },
  insertion: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  merge: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
  },
  quick: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
  },
};

const range = (from: number, to: number) => Array.from({ length: to - from }, (_, k) => from + k);

export function* bubbleSort(a: number[]): StepGenerator<number[]> {
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      const [x, y] = [a[i] as number, a[i + 1] as number];
      yield { events: [{ type: 'compare', i, j: i + 1 }], note: `Compare ${x} and ${y}.` };
      if (x > y) {
        a[i] = y;
        a[i + 1] = x;
        swapped = true;
        yield { events: [{ type: 'swap', i, j: i + 1 }], note: `${x} > ${y}: swap them.` };
      }
    }
    if (!swapped) {
      yield {
        events: [{ type: 'mark', indices: range(0, end + 1), as: 'sorted' }],
        note: 'No swaps in a full pass: sorted.',
      };
      return a;
    }
    yield {
      events: [{ type: 'mark', indices: [end], as: 'sorted' }],
      note: `${a[end]} has bubbled into place.`,
    };
  }
  if (a.length) yield { events: [{ type: 'mark', indices: [0], as: 'sorted' }], note: 'Sorted.' };
  return a;
}

export function* selectionSort(a: number[]): StepGenerator<number[]> {
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      yield {
        events: [{ type: 'compare', i: min, j }],
        note: `Is ${a[j]} smaller than ${a[min]}?`,
      };
      if ((a[j] as number) < (a[min] as number)) min = j;
    }
    if (min !== i) {
      const [x, y] = [a[i] as number, a[min] as number];
      a[i] = y;
      a[min] = x;
      yield {
        events: [{ type: 'swap', i, j: min }],
        note: `Move the smallest, ${y}, to index ${i}.`,
      };
    }
    yield { events: [{ type: 'mark', indices: [i], as: 'sorted' }], note: `Index ${i} is final.` };
  }
  if (a.length)
    yield { events: [{ type: 'mark', indices: [a.length - 1], as: 'sorted' }], note: 'Sorted.' };
  return a;
}

export function* insertionSort(a: number[]): StepGenerator<number[]> {
  for (let i = 1; i < a.length; i++) {
    for (let j = i; j > 0; j--) {
      const [x, y] = [a[j - 1] as number, a[j] as number];
      yield { events: [{ type: 'compare', i: j - 1, j }], note: `Compare ${x} and ${y}.` };
      if (x <= y) break;
      a[j - 1] = y;
      a[j] = x;
      yield { events: [{ type: 'swap', i: j - 1, j }], note: `${y} moves left past ${x}.` };
    }
  }
  yield { events: [{ type: 'mark', indices: range(0, a.length), as: 'sorted' }], note: 'Sorted.' };
  return a;
}

export function* mergeSort(a: number[]): StepGenerator<number[]> {
  function* sort(lo: number, hi: number): StepGenerator<void> {
    if (hi - lo < 2) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* sort(lo, mid);
    yield* sort(mid, hi);
    const left = a.slice(lo, mid);
    const right = a.slice(mid, hi);
    let i = 0;
    let j = 0;
    for (let k = lo; k < hi; k++) {
      let take: number;
      if (i < left.length && j < right.length) {
        yield {
          events: [{ type: 'compare', i: lo + i, j: mid + j }],
          note: `Merge: compare ${left[i]} and ${right[j]}.`,
        };
        // `<=` keeps equal values in their original order: merge sort is stable.
        take =
          (left[i] as number) <= (right[j] as number)
            ? (left[i++] as number)
            : (right[j++] as number);
      } else {
        take = i < left.length ? (left[i++] as number) : (right[j++] as number);
      }
      a[k] = take;
      yield {
        events: [{ type: 'write', i: k, value: take }],
        note: `Write ${take} to index ${k}.`,
      };
    }
  }
  yield* sort(0, a.length);
  yield { events: [{ type: 'mark', indices: range(0, a.length), as: 'sorted' }], note: 'Sorted.' };
  return a;
}

/** Lomuto partition with the last element as pivot (its O(n²) worst case is part of the lesson). */
export function* quickSort(a: number[]): StepGenerator<number[]> {
  function* sort(lo: number, hi: number): StepGenerator<void> {
    if (lo >= hi) {
      if (lo === hi)
        yield {
          events: [{ type: 'mark', indices: [lo], as: 'sorted' }],
          note: `${a[lo]} is in place.`,
        };
      return;
    }
    const pivot = a[hi] as number;
    yield { events: [{ type: 'mark', indices: [hi], as: 'pivot' }], note: `Pivot: ${pivot}.` };
    let store = lo;
    for (let i = lo; i < hi; i++) {
      yield {
        events: [{ type: 'compare', i, j: hi }],
        note: `Is ${a[i]} smaller than the pivot ${pivot}?`,
      };
      if ((a[i] as number) < pivot) {
        if (i !== store) {
          const [x, y] = [a[i] as number, a[store] as number];
          a[i] = y;
          a[store] = x;
          yield {
            events: [{ type: 'swap', i, j: store }],
            note: `Move ${x} left of the pivot's spot.`,
          };
        }
        store++;
      }
    }
    if (store !== hi) {
      a[hi] = a[store] as number;
      a[store] = pivot;
      yield {
        events: [
          { type: 'swap', i: store, j: hi },
          { type: 'unmark', indices: [hi] },
        ],
        note: `Put the pivot ${pivot} in its final place.`,
      };
    }
    yield {
      events: [{ type: 'mark', indices: [store], as: 'sorted' }],
      note: `${pivot} is in place.`,
    };
    yield* sort(lo, store - 1);
    yield* sort(store + 1, hi);
  }
  yield* sort(0, a.length - 1);
  return a;
}

export const SORTS: Record<SortAlgorithm, (a: number[]) => StepGenerator<number[]>> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
};
