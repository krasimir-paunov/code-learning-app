/**
 * A flat list of items with depths, turned into correctly nested list markup: a nested list
 * always goes inside the `<li>` it belongs to. In description-list mode, depth 0 items are
 * terms and depth 1 items describe the term above.
 */

export type ListKind = 'ul' | 'ol' | 'dl';

export interface Item {
  text: string;
  depth: number;
  /** Optional link target (menus are lists of links). */
  href?: string;
}

export const MAX_DEPTH = 2;

/** Depth an item may take at `index`: at most one deeper than the item above it. */
export function maxDepthAt(items: readonly Item[], index: number, kind: ListKind): number {
  if (index === 0) return 0;
  const limit = kind === 'dl' ? 1 : MAX_DEPTH;
  return Math.min(limit, (items[index - 1]?.depth ?? 0) + 1);
}

/** Keeps every item within the depth its position allows (after a move or a kind change). */
export function normalize(items: readonly Item[], kind: ListKind): Item[] {
  const out: Item[] = [];
  items.forEach((item, i) => {
    const depth = Math.max(0, Math.min(item.depth, maxDepthAt(out, i, kind)));
    out.push({ ...item, depth });
  });
  return out;
}

export function indent(items: readonly Item[], index: number, by: 1 | -1, kind: ListKind): Item[] {
  const item = items[index];
  if (!item) return [...items];
  const depth = Math.max(0, Math.min(item.depth + by, maxDepthAt(items, index, kind)));
  // Children move with their parent when it is outdented, as in an outline editor.
  return normalize(
    items.map((it, i) => (i === index ? { ...it, depth } : it)),
    kind,
  );
}

export function move(items: readonly Item[], index: number, by: 1 | -1, kind: ListKind): Item[] {
  const target = index + by;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  [next[index], next[target]] = [next[target] as Item, next[index] as Item];
  return normalize(next, kind);
}

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const content = (item: Item) =>
  item.href ? `<a href="${escape(item.href)}">${escape(item.text)}</a>` : escape(item.text);

/** Indented markup for the items, with `kinds[depth]` choosing ul or ol at each level. */
export function toHtml(items: readonly Item[], kind: ListKind, nestedKind: 'ul' | 'ol'): string {
  if (kind === 'dl') {
    const lines = items.map((item) =>
      item.depth === 0 ? `  <dt>${content(item)}</dt>` : `  <dd>${content(item)}</dd>`,
    );
    return ['<dl>', ...lines, '</dl>'].join('\n');
  }
  const lines: string[] = [];
  const pad = (n: number) => '  '.repeat(n);
  const open = (depth: number) => (depth === 0 ? kind : nestedKind);
  const render = (start: number, depth: number, indentLevel: number): number => {
    lines.push(`${pad(indentLevel)}<${open(depth)}>`);
    let i = start;
    while (i < items.length && (items[i]?.depth ?? 0) >= depth) {
      const item = items[i] as Item;
      const hasChildren = (items[i + 1]?.depth ?? -1) > depth;
      if (!hasChildren) {
        lines.push(`${pad(indentLevel + 1)}<li>${content(item)}</li>`);
        i++;
      } else {
        lines.push(`${pad(indentLevel + 1)}<li>${content(item)}`);
        i = render(i + 1, depth + 1, indentLevel + 2);
        lines.push(`${pad(indentLevel + 1)}</li>`);
      }
    }
    lines.push(`${pad(indentLevel)}</${open(depth)}>`);
    return i;
  };
  render(0, 0, 0);
  return lines.join('\n');
}

export interface ListSummary {
  kind: string;
  items: number;
  /** Nested lists, keyed by the text of the item that contains them. */
  nested: { parent: string; summary: ListSummary }[];
}

/** What a list announces: its kind, how many items, and the lists nested in its items. */
export function summarize(
  items: readonly Item[],
  kind: ListKind,
  nestedKind: 'ul' | 'ol',
): ListSummary {
  if (kind === 'dl') {
    return {
      kind: 'description list',
      items: items.filter((i) => i.depth === 0).length,
      nested: [],
    };
  }
  const build = (start: number, depth: number): [ListSummary, number] => {
    const summary: ListSummary = {
      kind: (depth === 0 ? kind : nestedKind) === 'ol' ? 'numbered list' : 'list',
      items: 0,
      nested: [],
    };
    let i = start;
    while (i < items.length && (items[i]?.depth ?? 0) >= depth) {
      const item = items[i] as Item;
      summary.items++;
      i++;
      if ((items[i]?.depth ?? -1) > depth) {
        const [child, next] = build(i, depth + 1);
        summary.nested.push({ parent: item.text, summary: child });
        i = next;
      }
    }
    return [summary, i];
  };
  return build(0, 0)[0];
}
