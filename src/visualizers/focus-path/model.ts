/**
 * Sequential focus order (HTML "sequential focus navigation"): elements with a positive
 * tabindex come first, lowest number first (ties in document order); then every other
 * focusable element with tabindex 0, in document order. tabindex -1 can be focused by script
 * but is never reached with Tab.
 */

export interface Focusable {
  /** Position in the document. */
  index: number;
  /** The element's tabIndex property: -1, 0 or a positive number. */
  tabIndex: number;
  /** Disabled or not rendered: out of the order whatever its tabIndex. */
  skipped?: boolean;
}

export function tabOrder(elements: readonly Focusable[]): number[] {
  const reachable = elements.filter((e) => !e.skipped && e.tabIndex >= 0);
  const positive = reachable
    .filter((e) => e.tabIndex > 0)
    .sort((a, b) => a.tabIndex - b.tabIndex || a.index - b.index);
  const natural = reachable.filter((e) => e.tabIndex === 0).sort((a, b) => a.index - b.index);
  return [...positive, ...natural].map((e) => e.index);
}

/** Steps where focus moves backwards on screen: up a line, or left along the same line. */
export function backwardSteps(
  points: readonly { x: number; y: number }[],
  tolerance = 8,
): number[] {
  const out: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    if (!a || !b) continue;
    const sameLine = Math.abs(a.y - b.y) <= tolerance;
    if (b.y < a.y - tolerance || (sameLine && b.x < a.x - tolerance)) out.push(i);
  }
  return out;
}
