/**
 * Splits a small, well-formed HTML snippet into its named parts (element, start tag, attribute,
 * attribute name and value, content, end tag) with character ranges, so the explorer can show
 * which parts any character belongs to. Lesson snippets are author-written; malformed input
 * throws at build time instead of being silently repaired the way a browser would.
 */

export type PartKind =
  | 'element'
  | 'start-tag'
  | 'end-tag'
  | 'tag-name'
  | 'attribute'
  | 'attribute-name'
  | 'attribute-value'
  | 'content';

export interface Part {
  id: number;
  kind: PartKind;
  /** [start, end) offsets in the source. */
  start: number;
  end: number;
  /** The enclosing part (null for top-level elements and text). */
  parent: number | null;
  /** Tag name of the element the part belongs to. */
  tag: string;
}

/** Elements that never have content or an end tag. */
export const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const NAME = /[a-zA-Z][a-zA-Z0-9-]*/y;
const ATTR_NAME = /[^\s"'>/=]+/y;
const SPACE = /\s*/y;

function at(re: RegExp, source: string, index: number): string | null {
  re.lastIndex = index;
  const match = re.exec(source);
  return match ? match[0] : null;
}

export function parseAnatomy(source: string): Part[] {
  const parts: Part[] = [];
  const add = (part: Omit<Part, 'id'>) => {
    parts.push({ ...part, id: parts.length });
    return parts.length - 1;
  };
  // Open elements: their element part, start tag end offset and tag name.
  const stack: { element: number; contentStart: number; tag: string }[] = [];
  const parentId = () => stack.at(-1)?.element ?? null;
  let i = 0;

  while (i < source.length) {
    if (source.startsWith('</', i)) {
      const name = at(NAME, source, i + 2);
      const open = stack.pop();
      if (!name || !open || name.toLowerCase() !== open.tag)
        throw new Error(`unexpected end tag at ${i}: expected </${open?.tag ?? '?'}>`);
      const close = source.indexOf('>', i);
      if (close === -1) throw new Error(`unclosed end tag at ${i}`);
      const element = parts[open.element] as Part;
      if (i > open.contentStart) {
        add({
          kind: 'content',
          start: open.contentStart,
          end: i,
          parent: open.element,
          tag: open.tag,
        });
      }
      const endTag = add({
        kind: 'end-tag',
        start: i,
        end: close + 1,
        parent: open.element,
        tag: open.tag,
      });
      add({
        kind: 'tag-name',
        start: i + 2,
        end: i + 2 + name.length,
        parent: endTag,
        tag: open.tag,
      });
      element.end = close + 1;
      i = close + 1;
    } else if (source[i] === '<') {
      const name = at(NAME, source, i + 1);
      if (!name) throw new Error(`expected a tag name at ${i + 1}`);
      const tag = name.toLowerCase();
      const element = add({ kind: 'element', start: i, end: i, parent: parentId(), tag });
      const startTag = add({ kind: 'start-tag', start: i, end: i, parent: element, tag });
      add({ kind: 'tag-name', start: i + 1, end: i + 1 + name.length, parent: startTag, tag });
      let j = i + 1 + name.length;
      for (;;) {
        j += at(SPACE, source, j)?.length ?? 0;
        if (source[j] === '>' || source.startsWith('/>', j)) break;
        const attrName = at(ATTR_NAME, source, j);
        if (!attrName) throw new Error(`bad attribute at ${j}`);
        const attribute = add({ kind: 'attribute', start: j, end: j, parent: startTag, tag });
        add({ kind: 'attribute-name', start: j, end: j + attrName.length, parent: attribute, tag });
        j += attrName.length;
        if (source[j] === '=') {
          const quote = source[j + 1];
          if (quote !== '"' && quote !== "'")
            throw new Error(`unquoted attribute value at ${j + 1}`);
          const closeQuote = source.indexOf(quote, j + 2);
          if (closeQuote === -1) throw new Error(`unclosed attribute value at ${j + 1}`);
          add({
            kind: 'attribute-value',
            start: j + 1,
            end: closeQuote + 1,
            parent: attribute,
            tag,
          });
          j = closeQuote + 1;
        }
        (parts[attribute] as Part).end = j;
      }
      const end = source[j] === '>' ? j + 1 : j + 2;
      (parts[startTag] as Part).end = end;
      if (VOID_ELEMENTS.has(tag)) (parts[element] as Part).end = end;
      else stack.push({ element, contentStart: end, tag });
      i = end;
    } else {
      const next = source.indexOf('<', i);
      i = next === -1 ? source.length : next;
    }
  }
  if (stack.length) throw new Error(`<${stack.at(-1)?.tag}> is never closed`);
  return parts;
}

/** Every part containing `offset`, outermost first. */
export function partsAt(parts: readonly Part[], offset: number): Part[] {
  return parts
    .filter((p) => p.start <= offset && offset < p.end)
    .sort((a, b) => a.start - b.start || b.end - a.end || a.id - b.id);
}

/** Boundaries where the set of covering parts changes, so the view can render segments. */
export function segments(source: string, parts: readonly Part[]): { start: number; end: number }[] {
  const cuts = new Set([0, source.length]);
  for (const p of parts) {
    cuts.add(p.start);
    cuts.add(p.end);
  }
  const sorted = [...cuts].sort((a, b) => a - b);
  return sorted.slice(0, -1).map((start, k) => ({ start, end: sorted[k + 1] as number }));
}
