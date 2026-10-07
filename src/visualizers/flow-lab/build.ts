import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Item = z.strictObject({
  id: z.string().regex(/^[a-z]$/),
  text: z.string().min(1),
  display: z.enum(['inline', 'inline-block', 'block', 'none']).default('inline'),
});

export const FlowLabPropsSchema = z.strictObject({
  /** The sentence: plain text pieces and the items to restyle. */
  sentence: z.array(z.union([z.string(), Item])).min(3),
  /** Declarations every item gets (sizes and margins whose effect depends on display). */
  itemCss: z.string().min(1),
});

export type FlowLabProps = z.infer<typeof FlowLabPropsSchema>;

export default {
  id: 'flow-lab',
  props: FlowLabPropsSchema,
} satisfies VisualizerBuild<FlowLabProps>;
