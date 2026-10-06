import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { INLINE_TAGS } from './model.ts';

const Phrase = z.strictObject({
  text: z.string().min(1),
  want: z.enum(INLINE_TAGS),
  why: z.string().min(1),
  datetime: z.string().optional(),
  title: z.string().optional(),
});

export const SemanticsLensPropsSchema = z.strictObject({
  /** Paragraphs made of plain strings and phrases to mark up. */
  paragraphs: z
    .array(z.array(z.union([z.string(), Phrase])).min(1))
    .min(1)
    .max(3),
});

export type SemanticsLensProps = z.infer<typeof SemanticsLensPropsSchema>;

export default {
  id: 'semantics-lens',
  props: SemanticsLensPropsSchema,
} satisfies VisualizerBuild<SemanticsLensProps>;
