import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const AxisCompassPropsSchema = z.strictObject({
  items: z.array(z.string().min(1)).min(2).max(5),
  direction: z.enum(['row', 'row-reverse', 'column', 'column-reverse']).default('row'),
});

export type AxisCompassProps = z.infer<typeof AxisCompassPropsSchema>;

export default {
  id: 'axis-compass',
  props: AxisCompassPropsSchema,
} satisfies VisualizerBuild<AxisCompassProps>;
