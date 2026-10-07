import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Size = z.strictObject({
  width: z.number().int().min(80).max(400),
  height: z.number().int().min(40).max(400),
});

export const OverflowLabPropsSchema = z.strictObject({
  /** Trusted HTML placed inside the resizable box. */
  content: z.string().min(1),
  /** What follows the box, so spilled content has something to paint over. */
  next: z.string().min(1),
  size: Size,
  min: Size.default({ width: 120, height: 60 }),
  max: Size.default({ width: 320, height: 260 }),
  overflow: z.enum(['visible', 'hidden', 'clip', 'scroll', 'auto']).default('visible'),
  /** The title truncated in the ellipsis panel. */
  title: z.string().min(1),
  titleWidth: z.number().int().min(120).max(400).default(220),
});

export type OverflowLabProps = z.infer<typeof OverflowLabPropsSchema>;

export default {
  id: 'overflow-lab',
  props: OverflowLabPropsSchema,
} satisfies VisualizerBuild<OverflowLabProps>;
