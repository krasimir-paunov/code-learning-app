/**
 * Selector specificity per Selectors Level 4: (a, b, c) = (IDs; classes, attributes and
 * pseudo-classes; type selectors and pseudo-elements). `:is()`, `:not()` and `:has()` count as
 * their most specific argument, `:where()` counts nothing, `:nth-child(… of S)` adds S.
 */

export type Specificity = [number, number, number];

const LEGACY_PSEUDO_ELEMENTS = new Set(['before', 'after', 'first-line', 'first-letter']);

/** Splits on top-level commas (not those inside parentheses or brackets). */
export function splitSelectorList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const ch of list) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function add(a: Specificity, b: Specificity): Specificity {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Negative when `a` is less specific than `b`. */
export function compareSpecificity(a: Specificity, b: Specificity): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function maxOf(list: string): Specificity {
  return splitSelectorList(list)
    .map(specificity)
    .reduce((best, s) => (compareSpecificity(s, best) > 0 ? s : best), [0, 0, 0]);
}

/** Reads a parenthesised argument starting at `open` (the index of "("). */
function argument(selector: string, open: number): { text: string; end: number } {
  let depth = 0;
  for (let i = open; i < selector.length; i++) {
    if (selector[i] === '(') depth++;
    else if (selector[i] === ')' && --depth === 0) {
      return { text: selector.slice(open + 1, i), end: i + 1 };
    }
  }
  return { text: selector.slice(open + 1), end: selector.length };
}

/** Specificity of one complex selector (no top-level commas). */
export function specificity(selector: string): Specificity {
  let result: Specificity = [0, 0, 0];
  let i = 0;
  const NAME = /[\w-]+/y;
  const readName = () => {
    NAME.lastIndex = i;
    const match = NAME.exec(selector);
    i = match ? NAME.lastIndex : i + 1;
    return match?.[0] ?? '';
  };
  while (i < selector.length) {
    const ch = selector[i] as string;
    if (ch === '#') {
      i++;
      readName();
      result = add(result, [1, 0, 0]);
    } else if (ch === '.') {
      i++;
      readName();
      result = add(result, [0, 1, 0]);
    } else if (ch === '[') {
      const close = selector.indexOf(']', i);
      i = close === -1 ? selector.length : close + 1;
      result = add(result, [0, 1, 0]);
    } else if (ch === ':') {
      if (selector[i + 1] === ':') {
        i += 2;
        readName();
        if (selector[i] === '(') i = argument(selector, i).end;
        result = add(result, [0, 0, 1]);
        continue;
      }
      i++;
      const name = readName().toLowerCase();
      let arg: string | undefined;
      if (selector[i] === '(') {
        const read = argument(selector, i);
        arg = read.text;
        i = read.end;
      }
      if (LEGACY_PSEUDO_ELEMENTS.has(name)) result = add(result, [0, 0, 1]);
      else if (name === 'where') continue;
      else if (name === 'is' || name === 'not' || name === 'has' || name === 'matches') {
        result = add(result, maxOf(arg ?? ''));
      } else if ((name === 'nth-child' || name === 'nth-last-child') && arg?.includes(' of ')) {
        result = add(add(result, [0, 1, 0]), maxOf(arg.slice(arg.indexOf(' of ') + 4)));
      } else result = add(result, [0, 1, 0]);
    } else if (/[a-zA-Z_-]/.test(ch)) {
      readName();
      result = add(result, [0, 0, 1]);
    } else {
      // Combinators, whitespace, `*` and namespace bars add nothing.
      i++;
    }
  }
  return result;
}

export function formatSpecificity(s: Specificity): string {
  return `(${s[0]}, ${s[1]}, ${s[2]})`;
}
