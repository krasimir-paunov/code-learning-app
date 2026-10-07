import type { Rule } from './rules.ts';
import {
  compareSpecificity,
  specificity,
  splitSelectorList,
  type Specificity,
} from './specificity.ts';

export interface MatchedDeclaration {
  property: string;
  value: string;
  enabled: boolean;
  /** A higher-ranked rule sets the same property. */
  overridden: boolean;
}

export interface MatchedRule {
  /** Position in the stylesheet (and in the CSSOM's cssRules). */
  index: number;
  selector: string;
  specificity: Specificity;
  declarations: MatchedDeclaration[];
}

export type DeclarationKey = `${number}:${string}`;

export const keyOf = (rule: number, property: string): DeclarationKey => `${rule}:${property}`;

/**
 * Rules that match `element`, the way DevTools lists them: most important first (higher
 * specificity, then later in the sheet), with declarations a higher rule already set marked
 * as overridden. Disabled declarations never win.
 */
export function matchedRules(
  element: Element,
  rules: readonly Rule[],
  values: ReadonlyMap<DeclarationKey, string>,
  disabled: ReadonlySet<DeclarationKey>,
): MatchedRule[] {
  const matched = rules.flatMap((rule, index) => {
    const matching = splitSelectorList(rule.selector).filter((s) => {
      try {
        return element.matches(s);
      } catch {
        return false;
      }
    });
    if (matching.length === 0) return [];
    const best = matching.map(specificity).reduce((a, b) => (compareSpecificity(b, a) > 0 ? b : a));
    return [{ index, rule, specificity: best }];
  });
  matched.sort((a, b) => compareSpecificity(b.specificity, a.specificity) || b.index - a.index);

  const won = new Set<string>();
  return matched.map(({ index, rule, specificity: s }) => ({
    index,
    selector: rule.selector,
    specificity: s,
    declarations: rule.declarations.map((d) => {
      const key = keyOf(index, d.property);
      const enabled = !disabled.has(key);
      const overridden = enabled && won.has(d.property);
      if (enabled) won.add(d.property);
      return { property: d.property, value: values.get(key) ?? d.value, enabled, overridden };
    }),
  }));
}
