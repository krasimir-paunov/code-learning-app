import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const PatternLabPropsSchema = z.strictObject({
  patterns: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        /** Trusted markup for the pattern. */
        html: z.string().min(1),
        /** Styling that has nothing to do with the lesson; always on. */
        base: z.string().min(1),
        /** The flex container, checked for overflow. */
        container: z.string().min(1),
        /** The items whose lines are counted. */
        items: z.string().min(1),
        toggles: z
          .array(
            z.strictObject({
              selector: z.string().min(1),
              declaration: z.string().min(1),
              without: z.string().min(1),
            }),
          )
          .min(1)
          .max(4),
      }),
    )
    .min(1)
    .max(4),
  width: z.strictObject({
    min: z.number().int().min(200),
    max: z.number().int().max(900),
    start: z.number().int(),
  }),
});

export type PatternLabProps = z.infer<typeof PatternLabPropsSchema>;

export default {
  id: 'pattern-lab',
  props: PatternLabPropsSchema,
} satisfies VisualizerBuild<PatternLabProps>;
