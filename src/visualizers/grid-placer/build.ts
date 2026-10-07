import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Cell = z.strictObject({ row: z.number().int().min(1), col: z.number().int().min(1) });

export const GridPlacerPropsSchema = z.strictObject({
  cols: z.number().int().min(2).max(6),
  rows: z.number().int().min(2).max(5),
  feature: z.string().min(1),
  /** Labels for the items that auto-place around the feature. */
  items: z.array(z.string().min(1)).min(1).max(10),
  start: z.strictObject({ from: Cell, to: Cell }),
});

export type GridPlacerProps = z.infer<typeof GridPlacerPropsSchema>;

export default {
  id: 'grid-placer',
  props: GridPlacerPropsSchema,
} satisfies VisualizerBuild<GridPlacerProps>;
