import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const TableBuilderPropsSchema = z
  .strictObject({
    caption: z.string().min(1),
    /** The corner label over the row headers, then one label per data column. */
    columns: z.array(z.string().min(1)).min(3).max(5),
    rows: z
      .array(z.strictObject({ header: z.string().min(1), values: z.array(z.string().min(1)) }))
      .min(2)
      .max(5),
  })
  .refine((t) => t.rows.every((r) => r.values.length === t.columns.length - 1), {
    message: 'every row needs one value per data column',
  });

export type TableBuilderProps = z.infer<typeof TableBuilderPropsSchema>;

export default {
  id: 'table-builder',
  props: TableBuilderPropsSchema,
} satisfies VisualizerBuild<TableBuilderProps>;
