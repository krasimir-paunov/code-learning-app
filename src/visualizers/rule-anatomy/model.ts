/**
 * One CSS rule as the browser sees it: does the selector parse, which declarations survive.
 * Browser checks are passed in (`supports`, `parses`), so the logic is testable anywhere.
 */

export interface Declaration {
  property: string;
  value: string;
}

export type DeclarationStatus = 'applied' | 'unknown-property' | 'invalid-value' | 'empty';

export interface RuleReport {
  selectorValid: boolean;
  declarations: { declaration: Declaration; status: DeclarationStatus }[];
}

export interface BrowserChecks {
  /** CSS.supports(property, value) */
  supports: (property: string, value: string) => boolean;
  /** Whether the selector parses (querySelector doesn't throw). */
  parses: (selector: string) => boolean;
}

/** A property name the browser knows, checked with a value every property accepts. */
const known = (checks: BrowserChecks, property: string) =>
  property.startsWith('--') || checks.supports(property, 'inherit');

export function checkRule(
  selector: string,
  declarations: readonly Declaration[],
  checks: BrowserChecks,
): RuleReport {
  return {
    selectorValid: selector.trim() !== '' && checks.parses(selector),
    declarations: declarations.map((declaration) => {
      const property = declaration.property.trim();
      const value = declaration.value.trim();
      let status: DeclarationStatus;
      if (!property || !value) status = 'empty';
      else if (!known(checks, property)) status = 'unknown-property';
      else if (!checks.supports(property, value)) status = 'invalid-value';
      else status = 'applied';
      return { declaration, status };
    }),
  };
}

/** The rule as CSS text (declarations exactly as typed, one per line). */
export function toCss(selector: string, declarations: readonly Declaration[]): string {
  const lines = declarations
    .filter((d) => d.property.trim() || d.value.trim())
    .map((d) => `  ${d.property.trim()}: ${d.value.trim()};`);
  return `${selector.trim() || '/* selector */'} {\n${lines.join('\n')}\n}`;
}

/**
 * CSS the stage applies: the learner's rule only when its selector parses (an invalid
 * selector drops the whole rule, exactly as browsers do), plus an outline on matches.
 */
export function stageCss(report: RuleReport, selector: string): string {
  if (!report.selectorValid) return '';
  const applied = report.declarations
    .filter((d) => d.status === 'applied')
    .map((d) => `${d.declaration.property.trim()}: ${d.declaration.value.trim()};`)
    .join(' ');
  return `${selector} { ${applied} }\n${selector} { outline: 2px dashed var(--accent); outline-offset: 3px; }`;
}

export const STATUS_TEXT: Record<DeclarationStatus, string> = {
  applied: 'applied',
  'unknown-property': 'ignored: the browser doesn’t know this property',
  'invalid-value': 'ignored: not a valid value for this property',
  empty: 'incomplete',
};
