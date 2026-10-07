import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const CascadeTracePropsSchema = z.strictObject({
  /** One root element (author content); every element in it can be inspected. */
  html: z.string().min(1),
  /** Flat rules only, so the trace can name the rule that set a value. */
  css: z.string().min(1),
  properties: z.array(z.string().min(1)).min(2).max(6),
  /** Child-index path to the element selected first, e.g. [1, 1] = second child of the second child. */
  start: z.array(z.number().int().min(0)).default([]),
});

export type CascadeTraceProps = z.infer<typeof CascadeTracePropsSchema>;

export default {
  id: 'cascade-trace',
  props: CascadeTracePropsSchema,
} satisfies VisualizerBuild<CascadeTraceProps>;
