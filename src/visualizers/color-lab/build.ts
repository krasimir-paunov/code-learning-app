import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Hex = z.string().regex(/^#[0-9a-f]{6}$/);

export const ColorLabPropsSchema = z.strictObject({
  /** The colour the learner edits, as hex. */
  color: Hex,
  sample: z.string().min(1).default('Trail report: wet rock ahead'),
  backgrounds: z
    .array(z.strictObject({ label: z.string().min(1), color: Hex }))
    .min(1)
    .max(3),
  /** The "same lightness?" row: one swatch per hue, in hsl() or oklch(). */
  hues: z.array(z.number().min(0).max(360)).min(3).max(8),
  hsl: z.strictObject({ s: z.number().min(0).max(100), l: z.number().min(0).max(100) }),
  oklch: z.strictObject({ l: z.number().min(0).max(1), c: z.number().min(0).max(0.4) }),
});

export type ColorLabProps = z.infer<typeof ColorLabPropsSchema>;

export default {
  id: 'color-lab',
  props: ColorLabPropsSchema,
} satisfies VisualizerBuild<ColorLabProps>;
