import { role } from '../shared/a11y/a11y.ts';

export interface FakeHeading {
  text: string;
  /** The start tag as written, e.g. `<div class="title">`. */
  tag: string;
}

const LOOKS_LIKE_HEADING = /\b(title|heading|headline|subtitle)\b/i;

function startTag(element: Element): string {
  const attrs = Array.from(element.attributes, (a) => ` ${a.name}="${a.value}"`).join('');
  return `<${element.localName}${attrs}>`;
}

/**
 * Text styled to look like a heading that assistive technology can't see as one: a paragraph
 * or div holding only bold text, or an element whose class says "title". A heuristic, worded
 * as a question in the view.
 */
export function fakeHeadings(root: Element): FakeHeading[] {
  return Array.from(root.querySelectorAll('*')).flatMap((element) => {
    if (role(element) === 'heading') return [];
    const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (!text || text.length > 80) return [];
    const onlyBold =
      /^(p|div)$/.test(element.localName) &&
      element.children.length === 1 &&
      /^(b|strong)$/.test(element.children[0]?.localName ?? '') &&
      element.children[0]?.textContent?.trim() === text;
    const namedLikeOne =
      LOOKS_LIKE_HEADING.test(element.getAttribute('class') ?? '') && element.children.length === 0;
    return onlyBold || namedLikeOne ? [{ text, tag: startTag(element) }] : [];
  });
}
