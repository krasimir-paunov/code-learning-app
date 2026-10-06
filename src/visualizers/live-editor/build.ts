import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Source = z.union([z.string(), z.strictObject({ file: z.string().min(1) })]);

export const LiveEditorAuthoredSchema = z.strictObject({
  /** File name → starting source, inline or from a snippet file. */
  files: z.record(z.string().regex(/^[\w-]+\.(html|css|js)$/), Source),
  editable: z.array(z.string()).optional(),
  preview: z.boolean().optional(),
});

type Authored = z.infer<typeof LiveEditorAuthoredSchema>;

export interface LiveEditorProps {
  files: Record<string, string>;
  editable?: string[];
  preview?: boolean;
}

export default {
  id: 'live-editor',
  props: LiveEditorAuthoredSchema,
  compile: (props, ctx) => ({
    ...props,
    files: Object.fromEntries(
      Object.entries(props.files).map(([name, source]) => [
        name,
        typeof source === 'string' ? source : ctx.read(source.file),
      ]),
    ),
  }),
} satisfies VisualizerBuild<Authored, never, LiveEditorProps>;
