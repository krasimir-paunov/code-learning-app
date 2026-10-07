/**
 * What CSS lengths resolve to, from the four things they can depend on. These are the unit
 * definitions from CSS Values and Units; `ch` uses the measured width of "0" in the font.
 */

export type Unit = 'px' | 'rem' | 'em' | '%' | 'ch' | 'vw';

export interface Context {
  /** The root font-size: 16px unless the user changes their browser's text size. */
  rootFont: number;
  /** The font-size of the element the length is used on (for widths, its own). */
  font: number;
  /** The width of the containing block (for %). */
  parentWidth: number;
  viewportWidth: number;
  /** Width of the "0" glyph at `font`, measured from the real font. */
  zeroWidth: number;
}

export interface Length {
  value: number;
  unit: Unit;
}

export function toPx({ value, unit }: Length, ctx: Context): number {
  switch (unit) {
    case 'px':
      return value;
    case 'rem':
      return value * ctx.rootFont;
    case 'em':
      return value * ctx.font;
    case '%':
      return (value / 100) * ctx.parentWidth;
    case 'ch':
      return value * ctx.zeroWidth;
    case 'vw':
      return (value / 100) * ctx.viewportWidth;
  }
}

export const DEPENDS_ON: Record<Unit, string> = {
  px: 'nothing: always the same',
  rem: 'the root font-size (the user’s browser text size)',
  em: 'this element’s font-size',
  '%': 'the parent’s width',
  ch: 'the width of “0” in this font',
  vw: 'the viewport width',
};

/** Font sizes down a nesting of elements that each set `font-size: <factor><unit>`. */
export function nestedSizes(
  factor: number,
  unit: 'em' | 'rem',
  depth: number,
  rootFont: number,
): number[] {
  const sizes: number[] = [];
  let parent = rootFont;
  for (let level = 0; level < depth; level++) {
    const size = unit === 'em' ? parent * factor : rootFont * factor;
    sizes.push(size);
    parent = size;
  }
  return sizes;
}
