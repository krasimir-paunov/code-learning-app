import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const LayoutChooserPropsSchema = z.strictObject({
  scenarios: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        html: z.string().min(1),
        /** Styling shared by both versions. */
        base: z.string().default(''),
        flex: z.string().min(1),
        grid: z.string().min(1),
        better: z.enum(['flex', 'grid']),
        why: z.string().min(1),
        instead: z.string().min(1),
      }),
    )
    .min(2)
    .max(5),
  width: z.strictObject({
    min: z.number().int().min(200),
    max: z.number().int().max(900),
    start: z.number().int(),
  }),
});

export type LayoutChooserProps = z.infer<typeof LayoutChooserPropsSchema>;

export default {
  id: 'layout-chooser',
  props: LayoutChooserPropsSchema,
} satisfies VisualizerBuild<LayoutChooserProps>;
