import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const NthLabPropsSchema = z.strictObject({
  items: z
    .array(z.strictObject({ label: z.string().min(1), soldOut: z.boolean().default(false) }))
    .min(4)
    .max(14),
  /** Starting formula first, then quick picks. */
  picks: z.array(z.string().min(1)).min(1).max(10),
});

export type NthLabProps = z.infer<typeof NthLabPropsSchema>;

export default {
  id: 'nth-lab',
  props: NthLabPropsSchema,
} satisfies VisualizerBuild<NthLabProps>;
