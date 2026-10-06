import { binarySearch, linearSearch } from '../shared/algorithms/searching.ts';
import { seeded } from '../shared/random.ts';
import { allFrames, TraceCursor, type StepGenerator } from '../shared/trace.ts';

export type SearchAlgorithm = 'linear' | 'binary';
export type TargetMode = 'present' | 'missing';

export const SEARCHES: Record<
  SearchAlgorithm,
  (xs: number[], target: number) => StepGenerator<number>
> = {
  linear: linearSearch,
  binary: binarySearch,
};

export const SEARCH_TITLES: Record<SearchAlgorithm, string> = {
  linear: 'Linear search',
  binary: 'Binary search',
};

/** Sorted, evenly spaced values (3i + 2) and a target that is present or missing. */
export function raceInput(
  n: number,
  mode: TargetMode,
  seed: number,
): { array: number[]; target: number } {
  const array = Array.from({ length: n }, (_, i) => 3 * i + 2);
  const k = Math.floor(seeded(seed)() * n);
  // Missing targets fall between two values (3k + 3 is never 3i + 2).
  return { array, target: mode === 'present' ? (array[k] as number) : 3 * k + 3 };
}

/** The indices an algorithm checks, in order: the steps of a `trace` challenge. */
export function probeSteps(
  algorithm: SearchAlgorithm,
  array: readonly number[],
  target: number,
): number[] {
  const cursor = new TraceCursor(array, (xs) => SEARCHES[algorithm](xs, target));
  return allFrames(cursor)
    .filter((f) => f.activeKind === 'probe')
    .map((f) => f.active[0] as number);
}
