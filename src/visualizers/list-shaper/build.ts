import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Item = z.strictObject({
  text: z.string().min(1),
  depth: z.number().int().min(0).max(2),
  href: z.string().optional(),
});

export const ListShaperPropsSchema = z.strictObject({
  presets: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        kind: z.enum(['ul', 'ol', 'dl']),
        nestedKind: z.enum(['ul', 'ol']).default('ul'),
        items: z.array(Item).min(2).max(10),
      }),
    )
    .min(1)
    .max(4),
});

export type ListShaperProps = z.infer<typeof ListShaperPropsSchema>;

export default {
  id: 'list-shaper',
  props: ListShaperPropsSchema,
} satisfies VisualizerBuild<ListShaperProps>;
