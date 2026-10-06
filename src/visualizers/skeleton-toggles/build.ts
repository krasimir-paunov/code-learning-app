import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const SkeletonTogglesPropsSchema = z.strictObject({
  page: z.strictObject({
    title: z.string().min(1),
    heading: z.string().min(1),
    body: z.array(z.string().min(1)).min(1).max(4),
    lang: z.string().min(2),
    fileName: z.string().min(1),
  }),
});

export type SkeletonTogglesProps = z.infer<typeof SkeletonTogglesPropsSchema>;

export default {
  id: 'skeleton-toggles',
  props: SkeletonTogglesPropsSchema,
} satisfies VisualizerBuild<SkeletonTogglesProps>;
