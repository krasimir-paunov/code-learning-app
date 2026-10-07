import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { INPUT_TYPES } from './model.ts';

const Type = z.enum(INPUT_TYPES);
const Mode = z.enum(['text', 'decimal', 'numeric', 'tel', 'search', 'email', 'url', 'none']);

export const InputGalleryPropsSchema = z.strictObject({
  needs: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        name: z.string().regex(/^[a-z][\w-]*$/),
        best: z.strictObject({
          type: Type,
          inputmode: Mode.optional(),
          autocomplete: z.string().optional(),
          /** Extra attributes for the recommended markup, e.g. `min="1" max="8"`. */
          attrs: z.string().optional(),
        }),
        /** Why the best type fits; shown when the learner picks it. */
        why: z.string().min(1),
        /** What goes wrong with a specific other type. */
        pitfalls: z.partialRecord(Type, z.string().min(1)).default({}),
      }),
    )
    .min(2)
    .max(8),
});

export type InputGalleryProps = z.infer<typeof InputGalleryPropsSchema>;

export default {
  id: 'input-gallery',
  props: InputGalleryPropsSchema,
} satisfies VisualizerBuild<InputGalleryProps>;
