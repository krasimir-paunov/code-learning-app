/**
 * Width media queries, evaluated for a viewport width in px: `(min-width: 40rem)`,
 * `(max-width: 600px)` and the range syntax `(width >= 48rem)`, `(40rem <= width < 64rem)`.
 * rem and em in media queries are always 16px here: they use the browser's default text size,
 * not the page's root font-size.
 */

const toPx = (value: number, unit: string) => (unit === 'px' ? value : value * 16);

const LENGTH = String.raw`(\d*\.?\d+)(px|rem|em)`;

type Test = (width: number) => boolean;

function condition(text: string): Test | null {
  const c = text.trim();
  let m = new RegExp(String.raw`^(min|max)-width:\s*${LENGTH}$`).exec(c);
  if (m) {
    const px = toPx(Number(m[2]), m[3] ?? 'px');
    return m[1] === 'min' ? (w) => w >= px : (w) => w <= px;
  }
  m = new RegExp(String.raw`^width\s*(>=|<=|>|<)\s*${LENGTH}$`).exec(c);
  if (m) {
    const px = toPx(Number(m[2]), m[3] ?? 'px');
    return compare(m[1] ?? '>=', px);
  }
  m = new RegExp(String.raw`^${LENGTH}\s*(<=|<)\s*width\s*(<=|<)\s*${LENGTH}$`).exec(c);
  if (m) {
    const low = toPx(Number(m[1]), m[2] ?? 'px');
    const high = toPx(Number(m[5]), m[6] ?? 'px');
    const lowTest = m[3] === '<' ? (w: number) => w > low : (w: number) => w >= low;
    const highTest = m[4] === '<' ? (w: number) => w < high : (w: number) => w <= high;
    return (w) => lowTest(w) && highTest(w);
  }
  return null;
}

function compare(op: string, px: number): Test {
  switch (op) {
    case '>':
      return (w) => w > px;
    case '<':
      return (w) => w < px;
    case '<=':
      return (w) => w <= px;
    default:
      return (w) => w >= px;
  }
}

/** `(a) and (b)` lists of width conditions; null if the query uses anything else. */
export function parseQuery(query: string): Test | null {
  const parts = [...query.matchAll(/\(([^()]*)\)/g)].map((m) => condition(m[1] ?? ''));
  if (parts.length === 0 || parts.some((p) => p === null)) return null;
  return (width) => parts.every((p) => p?.(width));
}

export function matches(query: string, width: number): boolean {
  return parseQuery(query)?.(width) ?? false;
}

/** The px values where a list of queries can change, for drawing breakpoints. */
export function breakpoints(queries: readonly string[]): number[] {
  const values = queries.flatMap((q) =>
    [...q.matchAll(new RegExp(LENGTH, 'g'))].map((m) => toPx(Number(m[1]), m[2] ?? 'px')),
  );
  return [...new Set(values)].sort((a, b) => a - b);
}
