import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const AlignPadPropsSchema = z.strictObject({
  items: z.array(z.string().min(1)).min(2).max(5),
});

export type AlignPadProps = z.infer<typeof AlignPadPropsSchema>;

export default {
  id: 'align-pad',
  props: AlignPadPropsSchema,
} satisfies VisualizerBuild<AlignPadProps>;
