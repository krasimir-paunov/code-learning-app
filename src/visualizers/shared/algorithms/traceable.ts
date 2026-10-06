import type { StepGenerator } from '../trace.ts';
import { BINARY_SEARCH_CODE, binarySearch, LINEAR_SEARCH_CODE, linearSearch } from './searching.ts';

/**
 * Algorithms the step tracer can follow line by line: reference code plus a generator whose
 * steps carry `line` and `vars`. Phase 4 adds two-pointers, sliding-window, etc. here.
 */
export const TRACEABLE = {
  'binary-search': {
    title: 'Binary search',
    code: BINARY_SEARCH_CODE,
    run: (xs: number[], target: number): StepGenerator<number> => binarySearch(xs, target),
  },
  'linear-search': {
    title: 'Linear search',
    code: LINEAR_SEARCH_CODE,
    run: (xs: number[], target: number): StepGenerator<number> => linearSearch(xs, target),
  },
} as const;

export type TraceableAlgorithm = keyof typeof TRACEABLE;
export const TRACEABLE_IDS = Object.keys(TRACEABLE) as [
  TraceableAlgorithm,
  ...TraceableAlgorithm[],
];
