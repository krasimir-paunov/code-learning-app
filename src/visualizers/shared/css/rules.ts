/**
 * A small parser for lesson stylesheets: flat rules (no at-rules), declarations kept exactly as
 * written, shorthands included. The order matches the CSSOM's `cssRules` for such sheets, so a
 * view can show authored text and still edit the live rule.
 */

export interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

export interface Rule {
  selector: string;
  declarations: Declaration[];
}

export function parseRules(css: string): Rule[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('{', i);
    if (open === -1) break;
    const close = source.indexOf('}', open);
    if (close === -1) break;
    const selector = source.slice(i, open).trim().replace(/\s+/g, ' ');
    const declarations = source
      .slice(open + 1, close)
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .flatMap((d) => {
        const colon = d.indexOf(':');
        if (colon === -1) return [];
        const raw = d.slice(colon + 1).trim();
        const important = /!\s*important$/i.test(raw);
        return [
          {
            property: d.slice(0, colon).trim().toLowerCase(),
            value: important ? raw.replace(/\s*!\s*important$/i, '') : raw,
            important,
          },
        ];
      });
    if (selector) rules.push({ selector, declarations });
    i = close + 1;
  }
  return rules;
}
