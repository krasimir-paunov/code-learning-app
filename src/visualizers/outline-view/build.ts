import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const OutlineViewPropsSchema = z.strictObject({
  examples: z
    .array(z.strictObject({ label: z.string().min(1), source: z.string().min(1) }))
    .min(1)
    .max(4),
});

export type OutlineViewProps = z.infer<typeof OutlineViewPropsSchema>;

export default {
  id: 'outline-view',
  props: OutlineViewPropsSchema,
} satisfies VisualizerBuild<OutlineViewProps>;
