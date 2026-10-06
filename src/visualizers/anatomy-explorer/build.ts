import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { parseAnatomy, type Part } from './model.ts';

const Authored = z.strictObject({
  examples: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        source: z.string().min(1),
        /** Extra notes for specific attribute names, e.g. { href: 'Where the link goes.' } */
        notes: z.record(z.string(), z.string()).default({}),
        /** What to render instead of `source` (e.g. a placeholder image instead of a missing file). */
        preview: z.string().min(1).optional(),
      }),
    )
    .min(1)
    .max(5),
});
type AuthoredProps = z.infer<typeof Authored>;

export interface AnatomyExample {
  label: string;
  source: string;
  notes: Record<string, string>;
  preview?: string;
  parts: Part[];
}

export interface AnatomyExplorerProps {
  examples: AnatomyExample[];
}

export default {
  id: 'anatomy-explorer',
  props: Authored,
  // Parsed at build time: a malformed snippet fails the build instead of confusing learners.
  compile: (props) => ({
    examples: props.examples.map((e) => ({ ...e, parts: parseAnatomy(e.source) })),
  }),
} satisfies VisualizerBuild<AuthoredProps, never, AnatomyExplorerProps>;
