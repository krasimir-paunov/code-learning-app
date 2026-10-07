/**
 * Layout patterns as data: base CSS plus the few declarations that make each pattern work,
 * which the learner switches on and off. The view measures the real render; this module builds
 * the CSS and reads the measurements.
 */

export interface Toggle {
  selector: string;
  declaration: string;
  /** What breaks without it; shown while it is switched off. */
  without: string;
}

export function patternCss(
  base: string,
  toggles: readonly Toggle[],
  enabled: ReadonlySet<number>,
): string {
  const rules = toggles
    .filter((_, i) => enabled.has(i))
    .map((t) => `${t.selector} { ${t.declaration}; }`);
  return [base, ...rules].join('\n');
}

/** How many lines the items sit on, from their top edges (items on one line share a top). */
export function lineCount(tops: readonly number[], tolerance = 2): number {
  const lines: number[] = [];
  for (const top of [...tops].sort((a, b) => a - b)) {
    if (!lines.some((line) => Math.abs(line - top) <= tolerance)) lines.push(top);
  }
  return lines.length;
}
