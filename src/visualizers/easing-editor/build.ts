import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const EasingEditorPropsSchema = z.strictObject({
  start: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).default('linear'),
  durations: z.array(z.number().int().min(50).max(2000)).min(1).max(4),
});

export type EasingEditorProps = z.infer<typeof EasingEditorPropsSchema>;

export default {
  id: 'easing-editor',
  props: EasingEditorPropsSchema,
} satisfies VisualizerBuild<EasingEditorProps>;
