/**
 * What each `overflow` value does with content that doesn't fit, and the three declarations a
 * one-line ellipsis needs. The view compares them with the measured render.
 */

export type Overflow = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';

export const OVERFLOWS: readonly Overflow[] = ['visible', 'hidden', 'clip', 'scroll', 'auto'];

export interface OverflowFacts {
  /** Content outside the padding box is cut off. */
  clips: boolean;
  /** The user can scroll (wheel, touch, scrollbar) to the cut-off content. */
  userScroll: boolean;
  /** The box is a scroll container, so focus and scripts can still scroll it. */
  scrollContainer: boolean;
}

export const FACTS: Record<Overflow, OverflowFacts> = {
  visible: { clips: false, userScroll: false, scrollContainer: false },
  hidden: { clips: true, userScroll: false, scrollContainer: true },
  clip: { clips: true, userScroll: false, scrollContainer: false },
  scroll: { clips: true, userScroll: true, scrollContainer: true },
  auto: { clips: true, userScroll: true, scrollContainer: true },
};

export function describe(overflow: Overflow, overflowing: boolean): string {
  if (!overflowing) {
    return overflow === 'scroll'
      ? 'Everything fits, but `scroll` still reserves room for scrollbars on systems that show them.'
      : 'Everything fits, so there is no overflow to handle. Make the box smaller.';
  }
  switch (overflow) {
    case 'visible':
      return 'The extra content spills out and paints over what comes next. The box does not grow.';
    case 'hidden':
      return 'The extra content is cut off and users can’t scroll to it, though focus or a script still can.';
    case 'clip':
      return 'The extra content is cut off, and nothing can scroll the box, not even a script.';
    case 'scroll':
      return 'The box scrolls to reveal the rest, and keeps its scrollbars even when everything fits.';
    case 'auto':
      return 'The box scrolls to reveal the rest. Scrollbars appear only when they are needed.';
  }
}

export interface EllipsisParts {
  nowrap: boolean;
  hidden: boolean;
  ellipsis: boolean;
}

export const ELLIPSIS_DECLARATIONS: Record<keyof EllipsisParts, string> = {
  nowrap: 'white-space: nowrap',
  hidden: 'overflow: hidden',
  ellipsis: 'text-overflow: ellipsis',
};

export function ellipsisMissing(parts: EllipsisParts): string[] {
  return (Object.keys(ELLIPSIS_DECLARATIONS) as (keyof EllipsisParts)[])
    .filter((key) => !parts[key])
    .map((key) => ELLIPSIS_DECLARATIONS[key]);
}

export function ellipsisResult(parts: EllipsisParts): string {
  if (!parts.nowrap)
    return 'The title wraps onto more lines, so nothing overflows sideways to cut.';
  if (!parts.hidden)
    return 'One line, but it spills out of the card: there is no clipping to mark.';
  if (!parts.ellipsis) return 'One line, cut off mid-word with no sign that it continues.';
  return 'One line, cut off with “…”.';
}
