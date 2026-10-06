/** The CSS box model as numbers (pure; used by the box-inspector view and its tests). */

export type BoxSizing = 'content-box' | 'border-box';

export interface BoxInput {
  /** The `width` declaration in px. */
  width: number;
  padding: number;
  border: number;
  margin: number;
  boxSizing: BoxSizing;
  /** Height of the content itself (text), in px. */
  contentHeight: number;
}

export interface BoxLayout {
  content: { width: number; height: number };
  /** Content + padding + border: what you see, and what offsetWidth reports. */
  borderBox: { width: number; height: number };
  /** Border box + margin: the space the element takes in the layout. */
  marginBox: { width: number; height: number };
  /** One sentence that explains the width arithmetic. */
  explanation: string;
}

export function layoutBox({
  width,
  padding,
  border,
  margin,
  boxSizing,
  contentHeight,
}: BoxInput): BoxLayout {
  const inner = 2 * padding + 2 * border;
  // border-box: `width` already includes padding and border (content can't go below 0).
  const contentWidth = boxSizing === 'border-box' ? Math.max(0, width - inner) : width;
  const borderBoxWidth = contentWidth + inner;
  const borderBoxHeight = contentHeight + inner;
  const explanation =
    boxSizing === 'content-box'
      ? `Visible width = ${width} (width) + 2 × ${padding} (padding) + 2 × ${border} (border) = ${borderBoxWidth}px.`
      : `Visible width = ${width}px (width already includes padding and border); content = ${width} − 2 × ${padding} − 2 × ${border} = ${contentWidth}px.`;
  return {
    content: { width: contentWidth, height: contentHeight },
    borderBox: { width: borderBoxWidth, height: borderBoxHeight },
    marginBox: { width: borderBoxWidth + 2 * margin, height: borderBoxHeight + 2 * margin },
    explanation,
  };
}

export function cssFor(input: BoxInput): string {
  return [
    '.box {',
    ...(input.boxSizing === 'border-box' ? ['  box-sizing: border-box;'] : []),
    `  width: ${input.width}px;`,
    `  padding: ${input.padding}px;`,
    `  border: ${input.border}px solid;`,
    `  margin: ${input.margin}px;`,
    '}',
  ].join('\n');
}
