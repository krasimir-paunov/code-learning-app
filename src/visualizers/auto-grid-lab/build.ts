import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const AutoGridLabPropsSchema = z.strictObject({
  mins: z.array(z.number().int().min(60).max(300)).min(1).max(4),
  items: z.number().int().min(1).max(10),
  gap: z.number().int().min(0).max(32).default(10),
  width: z.strictObject({
    min: z.number().int().min(160),
    max: z.number().int().max(900),
    start: z.number().int(),
  }),
  /** The dense-packing panel: item labels, and which ones span two columns. */
  dense: z.strictObject({
    items: z.array(z.string().min(1)).min(3).max(10),
    wide: z.array(z.string().min(1)),
  }),
});

export type AutoGridLabProps = z.infer<typeof AutoGridLabPropsSchema>;

export default {
  id: 'auto-grid-lab',
  props: AutoGridLabPropsSchema,
} satisfies VisualizerBuild<AutoGridLabProps>;
