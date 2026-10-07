import { matchedRules } from '../shared/css/matched.ts';
import type { Rule } from '../shared/css/rules.ts';

/** Properties the lessons offer that inherit by default. */
export const INHERITED = new Set([
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-align',
  'letter-spacing',
  'visibility',
]);

/**
 * Properties the browser's own stylesheet sets on some elements (Chromium's UA sheet). There
 * the value doesn't inherit: the element has its own, which is why links stay blue and buttons
 * keep their font.
 */
export const UA_SETS: Record<string, string[]> = {
  a: ['color'],
  button: [
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'letter-spacing',
    'line-height',
    'text-align',
    'padding',
    'border',
  ],
  h1: ['font-size', 'font-weight', 'margin'],
  h2: ['font-size', 'font-weight', 'margin'],
  h3: ['font-size', 'font-weight', 'margin'],
  p: ['margin'],
  ul: ['margin', 'padding'],
};

export type Keyword = 'inherit' | 'initial' | 'unset' | 'revert';
export const KEYWORDS: readonly Keyword[] = ['inherit', 'initial', 'unset', 'revert'];

export type Step =
  | { kind: 'declared'; element: Element; selector: string; value: string }
  | { kind: 'keyword'; element: Element; keyword: Keyword; selector: string }
  | { kind: 'passes'; element: Element }
  | { kind: 'browser'; element: Element }
  | { kind: 'not-inherited'; element: Element }
  | { kind: 'initial'; element: Element };

function winner(element: Element, rules: readonly Rule[], property: string) {
  for (const rule of matchedRules(element, rules, new Map(), new Set())) {
    const d = rule.declarations.find((x) => x.property === property && x.enabled && !x.overridden);
    if (d) return { selector: rule.selector, value: d.value.trim() };
  }
  return null;
}

/**
 * Where an element's value for `property` comes from, as a list of steps from the element up
 * to the decision. `root` is the topmost element considered (the page's content container).
 */
export function traceValue(
  element: Element,
  root: Element,
  rules: readonly Rule[],
  property: string,
): Step[] {
  const steps: Step[] = [];
  const inherits = INHERITED.has(property);
  let el: Element | null = element;
  while (el) {
    const declared = winner(el, rules, property);
    if (declared) {
      const keyword = KEYWORDS.find((k) => k === declared.value.toLowerCase());
      if (!keyword) {
        steps.push({ kind: 'declared', element: el, ...declared });
        return steps;
      }
      steps.push({ kind: 'keyword', element: el, keyword, selector: declared.selector });
      if (keyword === 'initial' || (keyword === 'unset' && !inherits)) {
        steps.push({ kind: 'initial', element: el });
        return steps;
      }
      // revert rolls back to the browser's own stylesheet; without a value there, it behaves
      // like unset.
      if (keyword === 'revert') {
        if (UA_SETS[el.localName]?.includes(property)) {
          steps.push({ kind: 'browser', element: el });
          return steps;
        }
        if (!inherits) {
          steps.push({ kind: 'initial', element: el });
          return steps;
        }
      }
    } else if (UA_SETS[el.localName]?.includes(property)) {
      steps.push({ kind: 'browser', element: el });
      return steps;
    } else if (!inherits && el === element) {
      steps.push({ kind: 'not-inherited', element: el });
      return steps;
    } else {
      steps.push({ kind: 'passes', element: el });
    }
    if (el === root) break;
    el = el.parentElement;
  }
  steps.push({ kind: 'initial', element: root });
  return steps;
}
