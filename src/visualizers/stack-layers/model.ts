/**
 * Stacking contexts and paint order (simplified from CSS 2 Appendix E). Inside a stacking
 * context, from the bottom up: negative z-index children, then elements that aren't
 * positioned (in document order), then positioned ones with z-index auto or 0 (in document
 * order), then positive z-index (lowest first). An element that starts its own context is
 * painted as one unit with everything inside it, so its children's z-index values only
 * compete with each other.
 */

export type Position = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

export interface Box {
  id: string;
  parent: string | null;
  position: Position;
  z: number | 'auto';
  opacity?: number;
  transform?: boolean;
  isolate?: boolean;
}

export function createsContext(box: Box): boolean {
  if (box.parent === null) return true;
  if (box.position === 'fixed' || box.position === 'sticky') return true;
  if (box.position !== 'static' && box.z !== 'auto') return true;
  return (box.opacity ?? 1) < 1 || box.transform === true || box.isolate === true;
}

export interface Layer {
  id: string;
  /** Ids of the stacking contexts this layer sits in, outermost first. */
  contexts: string[];
  /** The layer is itself a stacking context. */
  context: boolean;
}

/** Paint order, bottom first. */
export function paintOrder(boxes: readonly Box[]): Layer[] {
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const children = (id: string) => boxes.filter((b) => b.parent === id);
  const out: Layer[] = [];

  const paint = (root: Box, contexts: string[]) => {
    out.push({ id: root.id, contexts, context: true });
    const inner = [...contexts, root.id];
    // Everything in this context, not inside a nested one, in document order.
    const members: Box[] = [];
    const collect = (id: string) => {
      for (const child of children(id)) {
        members.push(child);
        if (!createsContext(child)) collect(child.id);
      }
    };
    collect(root.id);
    const z = (b: Box) => (b.z === 'auto' ? 0 : b.z);
    const negative = members
      .filter((b) => createsContext(b) && z(b) < 0)
      .sort((a, b) => z(a) - z(b));
    const flow = members.filter((b) => b.position === 'static' && !createsContext(b));
    const zeroish = members.filter(
      (b) => (b.position !== 'static' || createsContext(b)) && z(b) === 0,
    );
    const positive = members
      .filter((b) => createsContext(b) && z(b) > 0)
      .sort((a, b) => z(a) - z(b));
    for (const box of [...negative, ...flow, ...zeroish, ...positive]) {
      if (createsContext(box)) paint(box, inner);
      else out.push({ id: box.id, contexts: inner, context: false });
    }
  };

  const root = boxes.find((b) => b.parent === null) ?? byId.values().next().value;
  if (root) paint(root, []);
  return out;
}

/** Of two boxes, the one painted later (on top). */
export function onTop(boxes: readonly Box[], a: string, b: string): string {
  const order = paintOrder(boxes).map((l) => l.id);
  return order.indexOf(a) > order.indexOf(b) ? a : b;
}

export interface LayerGroup {
  id: string;
  /** Members of this context, top first; nested contexts are groups themselves. */
  members: (LayerGroup | { id: string })[];
}

/** The paint order as a tree of contexts, each listing its members top first. */
export function layerTree(boxes: readonly Box[]): LayerGroup | null {
  const order = paintOrder(boxes);
  const build = (id: string): LayerGroup => ({
    id,
    members: order
      .filter((l) => l.contexts.at(-1) === id)
      .reverse()
      .map((l) => (l.context ? build(l.id) : { id: l.id })),
  });
  const root = order[0];
  return root ? build(root.id) : null;
}
