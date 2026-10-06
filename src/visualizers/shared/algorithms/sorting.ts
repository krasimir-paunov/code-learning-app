/**
 * Sorting step generators for the sort race (side-by-side algorithms, live counters).
 * Each sorts its own copy in place and narrates every comparison, swap and write, so the
 * race's counters are the algorithm's real operation counts.
 */
import type { Complexity, StepGenerator } from '../trace.ts';

export type SortAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';

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
  heap: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    stable: false,
  },
};

/**
 * The data-movement counter that describes each algorithm: exchanges for the swap-based sorts,
 * element writes for merge sort, which never swaps.
 */
export const SORT_METRIC: Record<SortAlgorithm, 'swaps' | 'writes'> = {
  bubble: 'swaps',
  selection: 'swaps',
  insertion: 'swaps',
  merge: 'writes',
  quick: 'swaps',
  heap: 'swaps',
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

/**
 * Top-down merge sort. A real merge copies the runs to a buffer and writes each element back once
 * per level; the race shows that in place instead: the merged prefix, then what is left of the left
 * run, then what is left of the right run. Taking from the left is a write where the value already
 * stands; taking from the right is a `move` into the next slot. Either way it is one write, so the
 * counter matches the buffered algorithm and every compared value is on screen.
 */
export function* mergeSort(a: number[]): StepGenerator<number[]> {
  function* sort(lo: number, hi: number): StepGenerator<void> {
    if (hi - lo < 2) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* sort(lo, mid);
    yield* sort(mid, hi);
    // k: next slot to fill (and the head of the left run); r: head of the right run.
    let k = lo;
    let r = mid;
    while (k < hi) {
      const hasLeft = k < r;
      const hasRight = r < hi;
      let fromRight = !hasLeft;
      if (hasLeft && hasRight) {
        const [x, y] = [a[k] as number, a[r] as number];
        yield { events: [{ type: 'compare', i: k, j: r }], note: `Merge: compare ${x} and ${y}.` };
        // `<=` keeps equal values in their original order: merge sort is stable.
        fromRight = y < x;
      }
      if (fromRight) {
        const value = a[r] as number;
        a.splice(k, 0, ...a.splice(r, 1));
        yield {
          events: [{ type: 'move', from: r, to: k }],
          note: `Take ${value} from the right run into index ${k}.`,
        };
        r++;
      } else {
        const value = a[k] as number;
        yield {
          events: [{ type: 'write', i: k, value }],
          note: `Take ${value} from the left run into index ${k}.`,
        };
      }
      k++;
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

/** In-place heap sort: build a max-heap, then repeatedly swap the max to the end and re-heapify. */
export function* heapSort(a: number[]): StepGenerator<number[]> {
  function* siftDown(root: number, end: number): StepGenerator<void> {
    for (;;) {
      const left = 2 * root + 1;
      if (left >= end) return;
      let child = left;
      const right = left + 1;
      if (right < end) {
        yield {
          events: [{ type: 'compare', i: left, j: right }],
          note: `Which child is larger, ${a[left]} or ${a[right]}?`,
        };
        if ((a[right] as number) > (a[left] as number)) child = right;
      }
      const [x, y] = [a[root] as number, a[child] as number];
      yield {
        events: [{ type: 'compare', i: root, j: child }],
        note: `Is ${x} smaller than its child ${y}?`,
      };
      if (x >= y) return;
      a[root] = y;
      a[child] = x;
      yield { events: [{ type: 'swap', i: root, j: child }], note: `Sift ${x} down below ${y}.` };
      root = child;
    }
  }
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) yield* siftDown(i, a.length);
  for (let end = a.length - 1; end > 0; end--) {
    const max = a[0] as number;
    a[0] = a[end] as number;
    a[end] = max;
    yield {
      events: [
        { type: 'swap', i: 0, j: end },
        { type: 'mark', indices: [end], as: 'sorted' },
      ],
      note: `Move the largest, ${max}, to index ${end}.`,
    };
    yield* siftDown(0, end);
  }
  if (a.length) yield { events: [{ type: 'mark', indices: [0], as: 'sorted' }], note: 'Sorted.' };
  return a;
}

export const SORTS: Record<SortAlgorithm, (a: number[]) => StepGenerator<number[]>> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
  heap: heapSort,
};
