import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const TrackEditorPropsSchema = z.strictObject({
  tracks: z.array(z.string().min(1)).min(1).max(6),
  /** Tracks the learner can add with one click. */
  presets: z.array(z.string().min(1)).min(1).max(5),
  items: z.number().int().min(1).max(12).default(6),
  gap: z.number().int().min(0).max(40).default(12),
  width: z.strictObject({
    min: z.number().int().min(200),
    max: z.number().int().max(900),
    start: z.number().int(),
  }),
});

export type TrackEditorProps = z.infer<typeof TrackEditorPropsSchema>;

export default {
  id: 'track-editor',
  props: TrackEditorPropsSchema,
} satisfies VisualizerBuild<TrackEditorProps>;
