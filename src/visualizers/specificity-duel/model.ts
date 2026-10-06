import {
  compareSpecificity,
  specificity,
  splitSelectorList,
  type Specificity,
} from '../shared/css/specificity.ts';

/**
 * The author-origin cascade for one property, decided step by step the way browsers do:
 * importance, then inline style, then specificity, then order of appearance.
 */

export interface Contender {
  label: string;
  /** null for the inline style attribute. */
  specificity: Specificity | null;
  important: boolean;
  /** Position in the stylesheet (inline styles come last). */
  order: number;
}

export type Decider = 'important' | 'inline' | 'ids' | 'classes' | 'types' | 'order' | 'only';

export interface Verdict {
  winner: number;
  decider: Decider;
  explanation: string;
}

/**
 * Specificity of a selector list for one element: the most specific of the selectors in the
 * list that match it (`matches` defaults to "all of them").
 */
export function ruleSpecificity(
  selector: string,
  matches: (complex: string) => boolean = () => true,
): Specificity {
  return splitSelectorList(selector)
    .filter(matches)
    .map(specificity)
    .reduce((a, b) => (compareSpecificity(b, a) > 0 ? b : a), [0, 0, 0]);
}

export function decide(contenders: readonly Contender[]): Verdict | null {
  if (contenders.length === 0) return null;
  if (contenders.length === 1) {
    return { winner: 0, decider: 'only', explanation: `Only ${contenders[0]?.label} applies.` };
  }
  const indexed = contenders.map((c, i) => ({ ...c, i }));
  const important = indexed.filter((c) => c.important);
  let pool = important.length ? important : indexed;
  if (important.length && important.length < indexed.length) {
    const top = best(pool);
    return {
      winner: top.i,
      decider: 'important',
      explanation: `${top.label} is !important, which beats every normal declaration, whatever its specificity.`,
    };
  }
  const inline = pool.find((c) => c.specificity === null);
  if (inline) {
    return {
      winner: inline.i,
      decider: 'inline',
      explanation: `The inline style attribute beats any selector${important.length ? ' (both are !important)' : ''}.`,
    };
  }
  const top = best(pool);
  const rest = pool.filter((c) => c.i !== top.i);
  const runnerUp = best(rest);
  const [a, b] = [top.specificity as Specificity, runnerUp.specificity as Specificity];
  const columns: [Decider, string][] = [
    ['ids', 'IDs'],
    ['classes', 'classes, attributes and pseudo-classes'],
    ['types', 'types and pseudo-elements'],
  ];
  for (let k = 0; k < 3; k++) {
    if (a[k] !== b[k]) {
      const [decider, word] = columns[k] as [Decider, string];
      return {
        winner: top.i,
        decider,
        explanation: `Decided by ${word}: ${a[k]} against ${b[k]}${k > 0 ? ', after a tie in the columns to the left' : ''}.`,
      };
    }
  }
  pool = pool.filter((c) => compareSpecificity(c.specificity as Specificity, a) === 0);
  const last = pool.reduce((x, y) => (y.order > x.order ? y : x));
  return {
    winner: last.i,
    decider: 'order',
    explanation: `Same specificity, so the rule that comes later in the stylesheet wins: ${last.label}.`,
  };
}

function best<T extends Contender & { i: number }>(pool: readonly T[]): T {
  return pool.reduce((x, y) => {
    if (x.specificity === null) return x;
    if (y.specificity === null) return y;
    const c = compareSpecificity(y.specificity, x.specificity);
    return c > 0 || (c === 0 && y.order > x.order) ? y : x;
  });
}
