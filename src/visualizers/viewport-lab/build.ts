import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const ViewportLabPropsSchema = z.strictObject({
  /** The page body. */
  html: z.string().min(1),
  /** The same layout written different ways (e.g. mobile-first and desktop-first). */
  variants: z
    .array(z.strictObject({ name: z.string().min(1), css: z.string().min(1) }))
    .min(1)
    .max(3),
  start: z.number().int().min(320).max(1600).default(375),
  height: z.number().int().min(160).max(600).default(320),
});

export type ViewportLabProps = z.infer<typeof ViewportLabPropsSchema>;

export default {
  id: 'viewport-lab',
  props: ViewportLabPropsSchema,
} satisfies VisualizerBuild<ViewportLabProps>;
