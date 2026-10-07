import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const File = z.strictObject({ name: z.string().min(1), code: z.string() });

export const ArchitectureComparePropsSchema = z.strictObject({
  approaches: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        summary: z.string().min(1),
        files: z.array(File).min(1).max(3),
      }),
    )
    .min(2)
    .max(4),
  /** Change requests: for each approach, the files after the change and a short verdict. */
  tasks: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        changes: z.record(
          z.string(),
          z.strictObject({ files: z.array(File).min(1), note: z.string().min(1) }),
        ),
      }),
    )
    .min(1)
    .max(4),
});

export type ArchitectureCompareProps = z.infer<typeof ArchitectureComparePropsSchema>;

export default {
  id: 'architecture-compare',
  props: ArchitectureComparePropsSchema,
} satisfies VisualizerBuild<ArchitectureCompareProps>;
