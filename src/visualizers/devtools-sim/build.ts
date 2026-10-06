import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const DevtoolsSimPropsSchema = z.strictObject({
  /** The page under inspection (author content). */
  html: z.string().min(1),
  /** Flat rules only (no at-rules): the Styles pane edits them live. */
  css: z.string().min(1),
  url: z.string().default('https://shop.example/trail-shoes'),
});

export type DevtoolsSimProps = z.infer<typeof DevtoolsSimPropsSchema>;

export default {
  id: 'devtools-sim',
  props: DevtoolsSimPropsSchema,
} satisfies VisualizerBuild<DevtoolsSimProps>;
