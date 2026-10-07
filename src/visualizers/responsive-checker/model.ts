/**
 * Layout checks for a page rendered at several widths and in two themes. Each check reads the
 * boxes and computed styles that the sandbox measures, so the browser decides, not a model.
 */
import type { Measurement } from '../../engine/runners/contract.ts';

export type Theme = 'light' | 'dark';

interface Scope {
  label: string;
  /** Widths the check applies at; every width when left out. */
  at?: number[] | undefined;
  theme?: Theme | undefined;
}

export type Check = Scope &
  (
    | { kind: 'stacked'; a: string; b: string }
    | { kind: 'row'; a: string; b: string }
    | { kind: 'fits'; selector: string }
    | { kind: 'max-width'; selector: string; max: number }
    | { kind: 'style'; selector: string; property: string; value: string }
  );

export interface Render {
  width: number;
  theme: Theme;
}

export const renderKey = ({ width, theme }: Render) => `${width}:${theme}`;

/** The page in a theme: the html marks its root with data-theme="light". */
export const withTheme = (html: string, theme: Theme) =>
  html.replace('data-theme="light"', `data-theme="${theme}"`);

export const appliesAt = (check: Check, width: number, widths: number[]) =>
  (check.at ?? widths).includes(width);

/** Every width × theme combination some check needs. */
export function rendersFor(checks: Check[], widths: number[]): Render[] {
  const keys = new Map<string, Render>();
  for (const check of checks) {
    for (const width of widths) {
      if (!appliesAt(check, width, widths)) continue;
      const render = { width, theme: check.theme ?? 'light' };
      keys.set(renderKey(render), render);
    }
  }
  return [...keys.values()];
}

/** What the sandbox has to measure for these checks. */
export function measureFor(checks: Check[]): { selectors: string[]; properties: string[] } {
  const selectors = new Set<string>();
  const properties = new Set<string>();
  for (const check of checks) {
    if ('a' in check) {
      selectors.add(check.a);
      selectors.add(check.b);
    } else selectors.add(check.selector);
    if (check.kind === 'style') properties.add(check.property);
  }
  return { selectors: [...selectors], properties: [...properties] };
}

export interface Outcome {
  pass: boolean;
  detail: string;
}

/** Sub-pixel rounding in layout. */
const EPSILON = 1;
const px = (n: number) => `${Math.round(n)}px`;

export function evaluate(
  check: Check,
  measurements: Record<string, Measurement>,
  width: number,
): Outcome {
  const boxOf = (selector: string) => measurements[selector]?.box;
  switch (check.kind) {
    case 'stacked':
    case 'row': {
      const a = boxOf(check.a);
      const b = boxOf(check.b);
      if (!a || !b) return { pass: false, detail: `${a ? check.b : check.a} not found` };
      const below = b.y >= a.y + a.height - EPSILON;
      const beside = b.x >= a.x + a.width - EPSILON && Math.abs(a.y - b.y) <= EPSILON;
      return check.kind === 'stacked'
        ? { pass: below, detail: below ? 'one above the other' : 'side by side' }
        : { pass: beside, detail: beside ? 'side by side' : 'one above the other' };
    }
    case 'fits': {
      const box = boxOf(check.selector);
      if (!box) return { pass: false, detail: 'not found' };
      const right = box.x + box.width;
      return right <= width + EPSILON
        ? { pass: true, detail: `right edge at ${px(right)}` }
        : { pass: false, detail: `${px(right - width)} past the edge` };
    }
    case 'max-width': {
      const box = boxOf(check.selector);
      if (!box) return { pass: false, detail: 'not found' };
      return {
        pass: box.width <= check.max + EPSILON,
        detail: `${px(box.width)} wide`,
      };
    }
    case 'style': {
      const value = measurements[check.selector]?.styles?.[check.property]?.trim();
      if (value === undefined) return { pass: false, detail: 'not found' };
      return { pass: value === check.value, detail: value };
    }
  }
}

/** Every applicable check at every width, keyed by `check index → width → outcome`. */
export function runAll(
  checks: Check[],
  widths: number[],
  results: Map<string, Record<string, Measurement>>,
): (Map<number, Outcome> | undefined)[] {
  return checks.map((check) => {
    const row = new Map<number, Outcome>();
    for (const width of widths) {
      if (!appliesAt(check, width, widths)) continue;
      const measured = results.get(renderKey({ width, theme: check.theme ?? 'light' }));
      if (!measured) return undefined;
      row.set(width, evaluate(check, measured, width));
    }
    return row;
  });
}
