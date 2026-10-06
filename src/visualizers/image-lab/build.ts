import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const ImageLabPropsSchema = z.strictObject({
  images: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z][a-z0-9-]*$/),
        file: z.string().min(1),
        purpose: z.enum(['informative', 'decorative', 'link']),
        linkTo: z.string().optional(),
        shows: z.string().min(1),
      }),
    )
    .min(1)
    .max(4),
  layout: z.strictObject({
    /** The picture that "loads": a data URL, so nothing is fetched. */
    image: z.string().startsWith('data:image/'),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    heading: z.string().min(1),
    text: z.string().min(1),
    button: z.string().min(1),
  }),
});

export type ImageLabProps = z.infer<typeof ImageLabPropsSchema>;

export default {
  id: 'image-lab',
  props: ImageLabPropsSchema,
} satisfies VisualizerBuild<ImageLabProps>;
