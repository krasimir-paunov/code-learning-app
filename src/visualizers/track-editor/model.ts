/**
 * How a row of grid tracks shares the container: fixed tracks take their size first, gaps come
 * off next, and what's left is split between the `fr` tracks in proportion. Tracks sized by
 * content (`auto`, `minmax()` and the like) are left to the browser; the view shows its numbers.
 */

export type Track =
  { kind: 'px'; px: number } | { kind: 'fr'; fr: number } | { kind: 'other'; text: string };

export function parseTrack(text: string): Track {
  const value = text.trim();
  const px = /^(\d*\.?\d+)px$/.exec(value);
  if (px) return { kind: 'px', px: Number(px[1]) };
  const fr = /^(\d*\.?\d+)fr$/.exec(value);
  if (fr) return { kind: 'fr', fr: Number(fr[1]) };
  return { kind: 'other', text: value };
}

export interface FrMath {
  fixed: number;
  gaps: number;
  /** Space left for the fr tracks, never below 0. */
  free: number;
  totalFr: number;
  perFr: number;
  /** Sizes for px and fr tracks; null where the browser sizes by content. */
  sizes: (number | null)[];
}

/** Only exact when every track is px or fr; otherwise `sizes` marks the content-sized ones. */
export function frMath(tracks: readonly Track[], width: number, gap: number): FrMath {
  const fixed = tracks.reduce((sum, t) => sum + (t.kind === 'px' ? t.px : 0), 0);
  const gaps = gap * Math.max(0, tracks.length - 1);
  const free = Math.max(0, width - fixed - gaps);
  const totalFr = tracks.reduce((sum, t) => sum + (t.kind === 'fr' ? t.fr : 0), 0);
  // A total below 1fr only takes that fraction of the free space.
  const perFr = totalFr === 0 ? 0 : free / Math.max(1, totalFr);
  return {
    fixed,
    gaps,
    free,
    totalFr,
    perFr,
    sizes: tracks.map((t) => (t.kind === 'px' ? t.px : t.kind === 'fr' ? t.fr * perFr : null)),
  };
}

/** Where each grid line sits, from the resolved track sizes. Inner lines run through the middle of their gap. */
export function linePositions(sizes: readonly number[], gap: number): number[] {
  const lines = [0];
  let edge = 0;
  sizes.forEach((size, i) => {
    edge += size;
    const last = i === sizes.length - 1;
    lines.push(last ? edge : edge + gap / 2);
    edge += last ? 0 : gap;
  });
  return lines;
}
