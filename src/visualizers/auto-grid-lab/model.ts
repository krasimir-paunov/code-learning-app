/**
 * repeat(auto-fill | auto-fit, minmax(min, 1fr)): the browser makes as many tracks as fit at
 * the minimum size. auto-fill keeps the empty ones; auto-fit collapses them to 0 (and their
 * gaps with them), so the items stretch across the whole row.
 */

export type Repeat = 'auto-fill' | 'auto-fit';

export interface AutoTracks {
  /** How many tracks fit at the minimum size (at least one). */
  count: number;
  /** Track sizes as the browser reports them; collapsed tracks are 0. */
  sizes: number[];
}

export function autoTracks(
  mode: Repeat,
  width: number,
  min: number,
  gap: number,
  items: number,
): AutoTracks {
  const count = Math.max(1, Math.floor((width + gap) / (min + gap)));
  const used = mode === 'auto-fit' ? Math.max(1, Math.min(count, items)) : count;
  const size = Math.max(min, (width - gap * (used - 1)) / used);
  return {
    count,
    sizes: Array.from({ length: count }, (_, i) => (i < used ? size : 0)),
  };
}
