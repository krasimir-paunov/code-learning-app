/**
 * The containing block: the box that top/right/bottom/left are measured from.
 * - static, relative and sticky stay in the normal flow (relative shifts from its own spot,
 *   sticky sticks inside its scrolling box);
 * - absolute uses the nearest ancestor that is positioned (anything but static) or transformed,
 *   otherwise the page itself;
 * - fixed uses the viewport, unless an ancestor is transformed.
 */

export type Position = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

export interface Ancestor {
  id: string;
  position: Position;
  transformed?: boolean;
}

export type ContainingBlock =
  { kind: 'flow' } | { kind: 'ancestor'; id: string } | { kind: 'page' } | { kind: 'viewport' };

/** @param ancestors Nearest first. */
export function containingBlock(
  position: Position,
  ancestors: readonly Ancestor[],
): ContainingBlock {
  if (position === 'static' || position === 'relative' || position === 'sticky')
    return { kind: 'flow' };
  const found = ancestors.find((a) =>
    position === 'absolute' ? a.position !== 'static' || a.transformed : a.transformed,
  );
  if (found) return { kind: 'ancestor', id: found.id };
  return position === 'fixed' ? { kind: 'viewport' } : { kind: 'page' };
}

/** Whether the element still takes up its space in the flow. */
export function keepsSpace(position: Position): boolean {
  return position === 'static' || position === 'relative' || position === 'sticky';
}
