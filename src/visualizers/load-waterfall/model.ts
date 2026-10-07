/**
 * A simplified page load. Real browsers overlap more work, but the rules that decide the order
 * are these:
 * - the preload scanner finds every resource early, so downloads start almost at once;
 * - a classic script stops the parser until it has downloaded and run, and it also waits for
 *   stylesheets above it;
 * - stylesheets block the first paint;
 * - defer and module scripts run after parsing, in document order, before DOMContentLoaded;
 * - async scripts run as soon as they arrive, in whatever order that is.
 */

export type Kind = 'css' | 'script' | 'defer' | 'async' | 'module';

export interface Resource {
  id: string;
  kind: Kind;
  /** Download time in ms. */
  download: number;
  /** Run time in ms (scripts only). */
  run?: number;
}

export interface Timing {
  id: string;
  kind: Kind;
  start: number;
  loaded: number;
  /** When the script ran: [start, end]; null for stylesheets. */
  ran: [number, number] | null;
}

export interface Timeline {
  resources: Timing[];
  /** Spans where the parser is stopped, waiting on a script. */
  blocked: [number, number][];
  parseEnd: number;
  firstPaint: number;
  domContentLoaded: number;
  load: number;
  /** Script ids in the order they ran. */
  order: string[];
}

/** Each head element takes this long to parse; the body takes `body` ms in total. */
export function simulate(head: readonly Resource[], body = 60, step = 2): Timeline {
  let t = 0;
  let cssReady = 0;
  const blocked: [number, number][] = [];
  const runs = new Map<string, [number, number]>();
  const timings = head.map((r, i) => ({ r, start: i * step, loaded: i * step + r.download }));

  // async scripts run whenever they arrive; collect them and fit them in afterwards.
  const asyncs = timings.filter((x) => x.r.kind === 'async');

  for (const { r, loaded } of timings) {
    t += step;
    if (r.kind === 'css') cssReady = Math.max(cssReady, loaded);
    if (r.kind === 'script') {
      const ready = Math.max(loaded, cssReady);
      if (ready > t) blocked.push([t, ready]);
      const begin = Math.max(t, ready);
      const end = begin + (r.run ?? 0);
      runs.set(r.id, [begin, end]);
      t = end;
    }
  }
  const headParsed = t;
  const firstPaint = Math.max(cssReady, headParsed);
  let parseEnd = headParsed + body;

  // An async script that arrives while the parser is still busy pauses it for its run.
  for (const { r, loaded } of asyncs.sort((a, b) => a.loaded - b.loaded)) {
    const begin = Math.max(
      loaded,
      ...[...runs.values()].filter(([, end]) => end > loaded).map(([, end]) => end),
    );
    const end = begin + (r.run ?? 0);
    runs.set(r.id, [begin, end]);
    if (begin < parseEnd) parseEnd += r.run ?? 0;
  }

  let deferredEnd = parseEnd;
  for (const { r, loaded } of timings) {
    if (r.kind !== 'defer' && r.kind !== 'module') continue;
    const begin = Math.max(deferredEnd, loaded);
    deferredEnd = begin + (r.run ?? 0);
    runs.set(r.id, [begin, deferredEnd]);
  }
  const domContentLoaded = deferredEnd;
  const load = Math.max(
    domContentLoaded,
    ...[...runs.values()].map(([, end]) => end),
    ...timings.map((x) => x.loaded),
  );

  return {
    resources: timings.map(({ r, start, loaded }) => ({
      id: r.id,
      kind: r.kind,
      start,
      loaded,
      ran: runs.get(r.id) ?? null,
    })),
    blocked,
    parseEnd,
    firstPaint,
    domContentLoaded,
    load,
    order: [...runs.entries()].sort((a, b) => a[1][0] - b[1][0]).map(([id]) => id),
  };
}
