import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Z = z.union([z.number().int(), z.literal('auto')]);

export const StackLayersPropsSchema = z.strictObject({
  /** Trusted markup; each box is an element with the box's id. */
  html: z.string().min(1),
  css: z.string().default(''),
  boxes: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z][\w-]*$/),
        label: z.string().min(1),
        parent: z.string().nullable(),
        position: z.enum(['static', 'relative', 'absolute', 'fixed', 'sticky']),
        z: Z,
        /** The learner can change this box's z-index. */
        editable: z.boolean().default(false),
      }),
    )
    .min(2)
    .max(8),
  /** Switches that make a box a stacking context without z-index. */
  triggers: z
    .array(
      z.strictObject({ box: z.string().min(1), kind: z.enum(['opacity', 'transform', 'isolate']) }),
    )
    .max(3)
    .default([]),
  /** The two boxes that overlap; the readout says which one wins. */
  compare: z.tuple([z.string(), z.string()]),
});

export type StackLayersProps = z.infer<typeof StackLayersPropsSchema>;

export default {
  id: 'stack-layers',
  props: StackLayersPropsSchema,
} satisfies VisualizerBuild<StackLayersProps>;
