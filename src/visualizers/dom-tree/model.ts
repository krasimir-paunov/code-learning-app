/**
 * Two halves of the pipeline: a simplified tokenizer (what the source says) and a tree built
 * from the browser's real parse (what the browser made of it). Comparing the two shows which
 * elements the parser inserted.
 */

export type Token =
  | { type: 'doctype'; text: string }
  | { type: 'start'; name: string; text: string }
  | { type: 'end'; name: string; text: string }
  | { type: 'comment'; text: string }
  | { type: 'text'; text: string };

const TAG = /<!doctype[^>]*>|<!--[\s\S]*?(?:-->|$)|<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*>?/gi;

/**
 * Tokens as the learner wrote them. Simplified (no raw-text elements, no attribute decoding),
 * which is enough to show the idea and to count the start tags in the source.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of source.matchAll(TAG)) {
    const index = match.index;
    if (index > last) tokens.push({ type: 'text', text: source.slice(last, index) });
    const text = match[0];
    const name = match[1]?.toLowerCase();
    if (/^<!doctype/i.test(text)) tokens.push({ type: 'doctype', text });
    else if (text.startsWith('<!--')) tokens.push({ type: 'comment', text });
    else if (name && text.startsWith('</')) tokens.push({ type: 'end', name, text });
    else if (name) tokens.push({ type: 'start', name, text });
    last = index + text.length;
  }
  if (last < source.length) tokens.push({ type: 'text', text: source.slice(last) });
  return tokens;
}

export interface TreeNode {
  kind: 'element' | 'text' | 'comment' | 'doctype';
  /** Tag name for elements, the text for text and comment nodes. */
  label: string;
  attributes: [string, string][];
  /** True when the source has no start tag for this element: the parser created it. */
  added: boolean;
  /** Text made only of whitespace (hidden by default in the view). */
  whitespace: boolean;
  children: TreeNode[];
}

/** Builds the view tree from a parsed document, flagging elements the source never opened. */
export function buildTree(doc: Document, tokens: readonly Token[]): TreeNode {
  const remaining = new Map<string, number>();
  for (const token of tokens) {
    if (token.type === 'start') remaining.set(token.name, (remaining.get(token.name) ?? 0) + 1);
  }
  const visit = (node: Node): TreeNode | null => {
    if (node.nodeType === 1) {
      const element = node as Element;
      const name = element.localName;
      const left = remaining.get(name) ?? 0;
      if (left > 0) remaining.set(name, left - 1);
      return {
        kind: 'element',
        label: name,
        attributes: Array.from(element.attributes, (a) => [a.name, a.value] as [string, string]),
        added: left === 0,
        whitespace: false,
        children: Array.from(element.childNodes, visit).filter((n): n is TreeNode => n !== null),
      };
    }
    if (node.nodeType === 3) {
      const text = node.textContent ?? '';
      return {
        kind: 'text',
        label: text,
        attributes: [],
        added: false,
        whitespace: text.trim() === '',
        children: [],
      };
    }
    if (node.nodeType === 8) {
      return {
        kind: 'comment',
        label: node.textContent ?? '',
        attributes: [],
        added: false,
        whitespace: false,
        children: [],
      };
    }
    if (node.nodeType === 10) {
      return {
        kind: 'doctype',
        label: 'html',
        attributes: [],
        added: false,
        whitespace: false,
        children: [],
      };
    }
    return null;
  };
  return {
    kind: 'element',
    label: '#document',
    attributes: [],
    added: false,
    whitespace: false,
    children: Array.from(doc.childNodes, visit).filter((n): n is TreeNode => n !== null),
  };
}

export function countElements(node: TreeNode): number {
  return (
    (node.kind === 'element' && node.label !== '#document' ? 1 : 0) +
    node.children.reduce((sum, child) => sum + countElements(child), 0)
  );
}

export function addedElements(node: TreeNode): string[] {
  return [
    ...(node.kind === 'element' && node.added ? [node.label] : []),
    ...node.children.flatMap(addedElements),
  ];
}

/** The first `limit` bytes of the UTF-8 encoding, as hex pairs. */
export function hexBytes(source: string, limit: number): { hex: string[]; total: number } {
  const bytes = new TextEncoder().encode(source);
  return {
    hex: Array.from(bytes.slice(0, limit), (b) => b.toString(16).padStart(2, '0')),
    total: bytes.length,
  };
}
