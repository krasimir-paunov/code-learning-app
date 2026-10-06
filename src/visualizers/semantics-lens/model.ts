/**
 * Sentences with phrases whose meaning is known; the learner picks an element for each, and
 * the lens shows what that choice puts into the page.
 */

export const INLINE_TAGS = [
  'span',
  'b',
  'i',
  'strong',
  'em',
  'mark',
  'code',
  'time',
  'abbr',
] as const;
export type InlineTag = (typeof INLINE_TAGS)[number];

export interface Phrase {
  text: string;
  /** The element that matches the phrase's meaning. */
  want: InlineTag;
  /** Why, in one sentence (shown once the learner has chosen). */
  why: string;
  /** Machine-readable value for <time>. */
  datetime?: string;
  /** Expansion for <abbr>. */
  title?: string;
}

export type Part = string | Phrase;

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

/** The markup a set of choices produces (one choice per phrase, in order). */
export function toHtml(
  paragraphs: readonly (readonly Part[])[],
  choices: readonly InlineTag[],
): string {
  let k = 0;
  return paragraphs
    .map((parts) => {
      const inner = parts
        .map((part) => {
          if (typeof part === 'string') return escape(part);
          const tag = choices[k++] ?? 'span';
          const attrs =
            tag === 'time' && part.datetime
              ? ` datetime="${escape(part.datetime)}"`
              : tag === 'abbr' && part.title
                ? ` title="${escape(part.title)}"`
                : '';
          return `<${tag}${attrs}>${escape(part.text)}</${tag}>`;
        })
        .join('');
      return `<p>${inner}</p>`;
    })
    .join('\n');
}

/** Paragraph parts with each phrase's position among all phrases (its index in the choices). */
export function numbered(
  paragraphs: readonly (readonly Part[])[],
): (string | { phrase: Phrase; index: number })[][] {
  let index = 0;
  return paragraphs.map((parts) =>
    parts.map((part) => (typeof part === 'string' ? part : { phrase: part, index: index++ })),
  );
}

export function phrases(paragraphs: readonly (readonly Part[])[]): Phrase[] {
  return paragraphs.flat().filter((p): p is Phrase => typeof p !== 'string');
}

/** What each element adds that `<span>` doesn't (verified against Chromium's accessibility tree). */
export const ADDS: Record<InlineTag, { role: string | null; data?: string }> = {
  span: { role: null },
  b: { role: null },
  i: { role: null },
  strong: { role: 'strong' },
  em: { role: 'emphasis' },
  mark: { role: 'mark' },
  code: { role: 'code' },
  time: { role: 'time', data: 'datetime' },
  abbr: { role: null, data: 'title' },
};
