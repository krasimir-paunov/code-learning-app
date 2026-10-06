import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Paint = z.strictObject({ value: z.string().min(1), name: z.string().min(1) });

export const SpecificityDuelPropsSchema = z.strictObject({
  /** The page; the element that rules compete for has data-target. */
  html: z.string().includes('data-target'),
  css: z.string().default(''),
  rules: z
    .array(
      z.strictObject({
        selector: z.string().min(1),
        important: z.boolean().default(false),
        color: Paint,
      }),
    )
    .length(2),
  inline: Paint,
  picks: z.array(z.string().min(1)).min(2).max(10),
});

export type SpecificityDuelProps = z.infer<typeof SpecificityDuelPropsSchema>;

export default {
  id: 'specificity-duel',
  props: SpecificityDuelPropsSchema,
} satisfies VisualizerBuild<SpecificityDuelProps>;
