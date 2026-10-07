import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Name = z.string().regex(/^[a-z][a-z-]*$/);

export const AreaPainterPropsSchema = z
  .strictObject({
    palette: z
      .array(z.strictObject({ name: Name, color: z.string().regex(/^#[0-9a-f]{6}$/) }))
      .min(2)
      .max(6),
    /** The starting map: rows of names, "." for empty. */
    map: z
      .array(
        z
          .array(z.union([Name, z.literal('.')]))
          .min(2)
          .max(5),
      )
      .min(2)
      .max(5),
  })
  .refine((p) => p.map.every((row) => row.length === p.map[0]?.length), {
    message: 'every row of the map needs the same number of cells',
  });

export type AreaPainterProps = z.infer<typeof AreaPainterPropsSchema>;

export default {
  id: 'area-painter',
  props: AreaPainterPropsSchema,
} satisfies VisualizerBuild<AreaPainterProps>;
