import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const DomTreePropsSchema = z.strictObject({
  /** Starting sources the learner can switch between; each is editable. */
  examples: z
    .array(z.strictObject({ label: z.string().min(1), source: z.string().min(1) }))
    .min(1)
    .max(5),
  /** The address shown in the request stage. */
  url: z.string().url().default('https://example.com/menu.html'),
});

export type DomTreeProps = z.infer<typeof DomTreePropsSchema>;

export default {
  id: 'dom-tree',
  props: DomTreePropsSchema,
} satisfies VisualizerBuild<DomTreeProps>;
