import type { Segment } from './index.ts';

export const sentinel = (name: string) => `__BLANK_${name.replaceAll('-', '_')}__`;

const EMPTY_SPAN = /<span[^>]*><\/span>/g;

/** The opening tag of a span still open at the end of `html` (spans are never nested). */
function openSpan(html: string): string | undefined {
  const start = html.lastIndexOf('<span');
  if (start === -1 || html.indexOf('</span>', start) !== -1) return undefined;
  return /^<span[^>]*>/.exec(html.slice(start))?.[0];
}

/**
 * Splits one highlighted line (flat <span style> runs) at blank sentinels, closing and reopening
 * the surrounding span so every HTML piece stays balanced.
 */
export function splitLine(html: string, names: readonly string[]): Segment[] {
  const byToken = new Map(names.map((n) => [sentinel(n), n]));
  const pattern = new RegExp([...byToken.keys()].join('|'));
  const segments: Segment[] = [];
  let rest = html;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(rest))) {
    const before = rest.slice(0, match.index);
    const after = rest.slice(match.index + match[0].length);
    const open = openSpan(before);
    segments.push({ html: (open ? `${before}</span>` : before).replace(EMPTY_SPAN, '') });
    segments.push({ blank: byToken.get(match[0]) as string });
    rest = open ? `${open}${after}` : after;
  }
  segments.push({ html: rest.replace(EMPTY_SPAN, '') });
  return segments.filter((s) => !('html' in s) || s.html !== '');
}
