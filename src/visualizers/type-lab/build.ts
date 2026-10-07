import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { parseFontSize } from './model.ts';

const FontSize = z.string().refine((v) => parseFontSize(v) !== null, {
  message: 'must be px/rem/vw terms, optionally inside clamp()',
});

export const TypeLabPropsSchema = z.strictObject({
  /** Values the learner can pick with one click; the first one is shown first. */
  presets: z.array(FontSize).min(1).max(4),
  heading: z.string().min(1),
  viewport: z.number().int().min(320).max(1600).default(1280),
  /** The line-height panel: the article's line-height choices and its markup. */
  lineHeights: z.array(z.string().min(1)).min(2).max(4),
  article: z.string().min(1),
});

export type TypeLabProps = z.infer<typeof TypeLabPropsSchema>;

export default {
  id: 'type-lab',
  props: TypeLabPropsSchema,
} satisfies VisualizerBuild<TypeLabProps>;
