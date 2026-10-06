/**
 * Output comparison: line endings and trailing whitespace never matter, and runs of spaces
 * count as one (console.log separates values with one space; learners can't see the difference).
 */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

/** Short typed answers (blanks): trimmed, inner whitespace collapsed, optionally case-folded. */
export function normalizeAnswer(text: string, caseSensitive: boolean): string {
  const collapsed = text.trim().replace(/\s+/g, ' ');
  return caseSensitive ? collapsed : collapsed.toLowerCase();
}

export function sameSet(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const sorted = [...b].sort((x, y) => x - y);
  return [...a].sort((x, y) => x - y).every((v, i) => v === sorted[i]);
}
