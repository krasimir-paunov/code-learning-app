/**
 * Where a custom property's value comes from: the element's own matching rules first, then each
 * ancestor's (custom properties inherit). Rules are authored so that a later rule is also the
 * stronger one, so "last matching rule wins" stands in for the cascade here.
 */

export interface Declaration {
  name: string;
  value: string;
  enabled: boolean;
}

export interface VarRule {
  selector: string;
  declarations: Declaration[];
}

export type Source =
  | { kind: 'own'; value: string; selector: string }
  | { kind: 'inherited'; value: string; selector: string; depth: number }
  | { kind: 'unset' };

/**
 * @param chain For the element, then its parent, and so on: the indexes of the rules that
 *   match it, in source order.
 */
export function resolveVar(
  name: string,
  chain: readonly number[][],
  rules: readonly VarRule[],
): Source {
  for (const [depth, matching] of chain.entries()) {
    for (const index of [...matching].reverse()) {
      const rule = rules[index];
      const declaration = rule?.declarations.findLast((d) => d.enabled && d.name === name);
      if (!rule || !declaration) continue;
      return depth === 0
        ? { kind: 'own', value: declaration.value, selector: rule.selector }
        : { kind: 'inherited', value: declaration.value, selector: rule.selector, depth };
    }
  }
  return { kind: 'unset' };
}

/** The CSS for the rules, leaving out switched-off declarations. */
export function rulesCss(rules: readonly VarRule[]): string {
  return rules
    .map((rule) => {
      const body = rule.declarations
        .filter((d) => d.enabled)
        .map((d) => `  ${d.name}: ${d.value};`)
        .join('\n');
      return `${rule.selector} {\n${body}\n}`;
    })
    .join('\n');
}

/** Every `var(--name, fallback)` in a stylesheet, first fallback per name. */
export function fallbacks(css: string): Map<string, string | undefined> {
  const out = new Map<string, string | undefined>();
  for (const match of css.matchAll(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+?))?\s*\)/g)) {
    const [, name = '', fallback] = match;
    if (!out.has(name) || (out.get(name) === undefined && fallback)) out.set(name, fallback);
  }
  return out;
}

export function describeSource(source: Source, fallback: string | undefined): string {
  switch (source.kind) {
    case 'own':
      return `set here by ${source.selector}`;
    case 'inherited':
      return `inherited from ${source.selector}`;
    case 'unset':
      return fallback ? `not set, so the fallback ${fallback} is used` : 'not set, and no fallback';
  }
}
