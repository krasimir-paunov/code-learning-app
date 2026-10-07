/**
 * What an element's `display` (and `visibility`) means for its box: the rules the lesson
 * teaches, stated once. The view compares them with the measured render.
 */

export type Display = 'inline' | 'inline-block' | 'block' | 'none';
export type Visibility = 'visible' | 'hidden';

export interface BoxRules {
  /** Starts on a new line and takes the full width available. */
  ownLine: boolean;
  /** `width` and `height` take effect. */
  sizeApplies: boolean;
  /** Vertical margins push neighbours away. */
  verticalMargins: boolean;
  /** The element occupies space in the layout. */
  takesSpace: boolean;
  /** The element is drawn. */
  visible: boolean;
}

export function rulesFor(display: Display, visibility: Visibility): BoxRules {
  if (display === 'none') {
    return {
      ownLine: false,
      sizeApplies: false,
      verticalMargins: false,
      takesSpace: false,
      visible: false,
    };
  }
  return {
    ownLine: display === 'block',
    sizeApplies: display !== 'inline',
    verticalMargins: display !== 'inline',
    takesSpace: true,
    visible: visibility === 'visible',
  };
}

export function describe(display: Display, visibility: Visibility): string {
  if (display === 'none') return 'Gone: no box at all, and the text closes the gap.';
  const parts: string[] = [];
  if (display === 'inline')
    parts.push('flows inside the line like text; width, height and top/bottom margins are ignored');
  if (display === 'inline-block')
    parts.push('sits in the line, but width, height and margins apply');
  if (display === 'block') parts.push('takes its own line; width, height and margins apply');
  if (visibility === 'hidden') parts.push('invisible, but its space stays');
  const text = parts.join('; ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}
