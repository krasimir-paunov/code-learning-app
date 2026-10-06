import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { REGION_TAGS, type Region } from './model.ts';

const RegionSchema: z.ZodType<Region> = z.lazy(() =>
  z.strictObject({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    label: z.string().min(1),
    want: z.array(z.enum(REGION_TAGS)).min(1),
    side: z.boolean().optional(),
    children: z.array(RegionSchema).optional(),
  }),
);

export const LandmarkMapPropsSchema = z.strictObject({
  regions: z.array(RegionSchema).min(2).max(6),
});

export type LandmarkMapProps = z.infer<typeof LandmarkMapPropsSchema>;

export default {
  id: 'landmark-map',
  props: LandmarkMapPropsSchema,
} satisfies VisualizerBuild<LandmarkMapProps>;
