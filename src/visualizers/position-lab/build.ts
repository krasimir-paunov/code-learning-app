import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const PositionLabPropsSchema = z.strictObject({
  /** The page body: long enough to scroll, with the target inside the ancestors. */
  html: z.string().min(1),
  css: z.string().default(''),
  target: z.string().min(1),
  /** The target's offsets, shown and applied whatever the position. */
  offsets: z.string().min(1),
  /** Ancestors of the target, nearest first, which the learner can position or transform. */
  ancestors: z
    .array(z.strictObject({ id: z.string().min(1), selector: z.string().min(1) }))
    .min(1)
    .max(3),
  height: z.number().int().min(160).max(600).default(300),
});

export type PositionLabProps = z.infer<typeof PositionLabPropsSchema>;

export default {
  id: 'position-lab',
  props: PositionLabPropsSchema,
} satisfies VisualizerBuild<PositionLabProps>;
