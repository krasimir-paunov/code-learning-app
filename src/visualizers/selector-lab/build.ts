import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const SelectorLabPropsSchema = z.strictObject({
  /** The page selectors run against (author content). */
  html: z.string().min(1),
  /** The page's own styles. */
  css: z.string().default(''),
  /** Starting selector and quick picks. */
  picks: z.array(z.string().min(1)).min(1).max(10),
});

export type SelectorLabProps = z.infer<typeof SelectorLabPropsSchema>;

export default {
  id: 'selector-lab',
  props: SelectorLabPropsSchema,
} satisfies VisualizerBuild<SelectorLabProps>;
