import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const SizingLabPropsSchema = z.strictObject({
  /** Container width in CSS px (fits a phone at 320). */
  container: z.number().int().min(240).max(480).default(320),
  percent: z.number().int().min(20).max(80).default(50),
  padding: z.number().int().min(0).max(60).default(20),
  border: z.number().int().min(0).max(12).default(2),
  sizing: z.enum(['content-box', 'border-box']).default('content-box'),
});

export type SizingLabProps = z.infer<typeof SizingLabPropsSchema>;

export default {
  id: 'sizing-lab',
  props: SizingLabPropsSchema,
} satisfies VisualizerBuild<SizingLabProps>;
