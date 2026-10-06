import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Range = (min: number, max: number) =>
  z.strictObject({
    min: z.number().int().min(min),
    max: z.number().int().max(max),
    default: z.number().int(),
  });

export const BoxInspectorPropsSchema = z.strictObject({
  width: Range(20, 400).default({ min: 60, max: 320, default: 200 }),
  padding: Range(0, 80).default({ min: 0, max: 48, default: 20 }),
  border: Range(0, 40).default({ min: 0, max: 20, default: 5 }),
  margin: Range(0, 80).default({ min: 0, max: 48, default: 10 }),
  boxSizing: z.enum(['content-box', 'border-box']).default('content-box'),
  /** Offer the box-sizing switch (the next lesson's topic). */
  allowBoxSizing: z.boolean().default(false),
});

export type BoxInspectorProps = z.infer<typeof BoxInspectorPropsSchema>;

export default {
  id: 'box-inspector',
  props: BoxInspectorPropsSchema,
} satisfies VisualizerBuild<BoxInspectorProps>;
