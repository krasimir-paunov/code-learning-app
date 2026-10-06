/**
 * The An+B microsyntax of :nth-child(): parse it, list the positions it selects, and show the
 * values n = 0, 1, 2… produce, which is how the formula is meant to be read.
 */

export interface Formula {
  a: number;
  b: number;
}

/** Parses `odd`, `even`, `3`, `2n`, `-n+3`, `2n + 1`… or returns null. */
export function parseFormula(text: string): Formula | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, '');
  if (t === 'odd') return { a: 2, b: 1 };
  if (t === 'even') return { a: 2, b: 0 };
  if (/^[+-]?\d+$/.test(t)) return { a: 0, b: Number(t) };
  const m = /^([+-]?\d*)n([+-]\d+)?$/.exec(t);
  if (!m) return null;
  const coefficient = m[1] ?? '';
  const a =
    coefficient === '' || coefficient === '+' ? 1 : coefficient === '-' ? -1 : Number(coefficient);
  return { a, b: Number(m[2] ?? 0) };
}

/** Rows of "n → An+B" for n = 0…, stopping once the values leave 1…count for good. */
export function table(
  formula: Formula,
  count: number,
): { n: number; value: number; selects: boolean }[] {
  const rows: { n: number; value: number; selects: boolean }[] = [];
  for (let n = 0; n <= count + 1; n++) {
    const value = formula.a * n + formula.b;
    rows.push({ n, value, selects: value >= 1 && value <= count });
    if (formula.a === 0 || (formula.a > 0 && value > count) || (formula.a < 0 && value < 1)) break;
  }
  return rows;
}
