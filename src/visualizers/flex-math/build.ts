import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const FlexMathPropsSchema = z.strictObject({
  container: z.number().int().min(200).max(700),
  items: z
    .array(
      z.strictObject({
        text: z.string().min(1),
        grow: z.number().min(0).max(5),
        shrink: z.number().min(0).max(5),
        basis: z.number().int().min(0).max(400),
      }),
    )
    .min(2)
    .max(4),
});

export type FlexMathProps = z.infer<typeof FlexMathPropsSchema>;

export default {
  id: 'flex-math',
  props: FlexMathPropsSchema,
} satisfies VisualizerBuild<FlexMathProps>;
