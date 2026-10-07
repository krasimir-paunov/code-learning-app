import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const LoadWaterfallPropsSchema = z.strictObject({
  resources: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        kind: z.enum(['css', 'script', 'defer', 'async', 'module']),
        download: z.number().int().min(10).max(2000),
        run: z.number().int().min(0).max(500).optional(),
      }),
    )
    .min(2)
    .max(6),
  /** How long the body takes to parse, in ms. */
  body: z.number().int().min(10).max(500).default(80),
});

export type LoadWaterfallProps = z.infer<typeof LoadWaterfallPropsSchema>;

export default {
  id: 'load-waterfall',
  props: LoadWaterfallPropsSchema,
} satisfies VisualizerBuild<LoadWaterfallProps>;
