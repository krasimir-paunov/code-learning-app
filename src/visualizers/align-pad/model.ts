/**
 * Reverse lookup for Flexbox alignment: from "where should the items go" to the declarations
 * that put them there. In a row the main axis is horizontal; in a column it is vertical, so the
 * two properties swap which screen direction they control.
 */

export type Direction = 'row' | 'column';
export type Place = 'start' | 'center' | 'end';
export type Spread = 'space-between' | 'space-around' | 'space-evenly';

export interface Alignment {
  justifyContent: Place | Spread;
  alignItems: Place;
}

/** Where the items sit on screen → justify-content (main axis) and align-items (cross axis). */
export function alignmentFor(direction: Direction, horizontal: Place, vertical: Place): Alignment {
  return direction === 'row'
    ? { justifyContent: horizontal, alignItems: vertical }
    : { justifyContent: vertical, alignItems: horizontal };
}

/** The opposite: where on screen an alignment puts the items (null where it spreads them). */
export function placeOf(
  direction: Direction,
  alignment: Alignment,
): { horizontal: Place | null; vertical: Place | null } {
  const main = alignment.justifyContent.startsWith('space-')
    ? null
    : (alignment.justifyContent as Place);
  return direction === 'row'
    ? { horizontal: main, vertical: alignment.alignItems }
    : { horizontal: alignment.alignItems, vertical: main };
}

/** The auto margin that pushes an item (and everything after it) to the end of the main axis. */
export function pushMargin(direction: Direction): string {
  return direction === 'row' ? 'margin-inline-start' : 'margin-block-start';
}
