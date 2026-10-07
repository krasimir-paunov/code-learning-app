/**
 * Two percentage-width columns in a fixed container: whether they fit depends on box-sizing.
 * The view measures the real render; this predicts it, so the two can be compared in tests.
 */

export type BoxSizing = 'content-box' | 'border-box';

export interface SizingInput {
  container: number;
  /** Column width in percent of the container. */
  percent: number;
  padding: number;
  border: number;
  sizing: BoxSizing;
}

export interface SizingResult {
  /** What `width` resolves to. */
  width: number;
  /** The visible width of one column (border box). */
  visible: number;
  /** The content box left for text. */
  content: number;
  /** Total width of both columns side by side. */
  total: number;
  fits: boolean;
}

export function columns(input: SizingInput): SizingResult {
  const width = (input.container * input.percent) / 100;
  const extra = 2 * (input.padding + input.border);
  const visible = input.sizing === 'content-box' ? width + extra : Math.max(width, extra);
  const content = input.sizing === 'content-box' ? width : Math.max(0, width - extra);
  const total = 2 * visible;
  return { width, visible, content, total, fits: total <= input.container };
}

export function sizingCss(input: SizingInput): string {
  return `.col {
  box-sizing: ${input.sizing};
  width: ${input.percent}%;
  padding: ${input.padding}px;
  border: ${input.border}px solid;
}`;
}
