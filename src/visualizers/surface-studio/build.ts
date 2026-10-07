import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Options = z.array(z.string().min(1)).min(1).max(4);

export const SurfaceStudioPropsSchema = z.strictObject({
  /** Value choices per property; the first one is selected at the start. */
  options: z.strictObject({
    'border-radius': Options,
    'box-shadow': Options,
    'background-color': Options,
    'background-image': Options,
    border: Options,
  }),
  /** Card text, shown on the content layer. */
  title: z.string().min(1),
  text: z.string().min(1),
});

export type SurfaceStudioProps = z.infer<typeof SurfaceStudioPropsSchema>;

export default {
  id: 'surface-studio',
  props: SurfaceStudioPropsSchema,
} satisfies VisualizerBuild<SurfaceStudioProps>;
