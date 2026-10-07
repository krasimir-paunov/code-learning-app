import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const base = { label: z.string().min(1), selector: z.string().min(1) };
const Check = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('exists'), ...base }),
  z.strictObject({ kind: z.literal('count'), ...base, count: z.number().int().min(0) }),
  z.strictObject({ kind: z.literal('named'), ...base }),
  z.strictObject({ kind: z.literal('labelled'), ...base }),
  z.strictObject({
    kind: z.literal('attr'),
    ...base,
    attr: z.string().min(1),
    value: z.string().optional(),
  }),
  z.strictObject({ kind: z.literal('absent'), ...base }),
]);

export const SpecCheckerPropsSchema = z.strictObject({
  /** The markup the learner starts from and edits. */
  starter: z.string().min(1),
  /** Styling for the preview, so the page looks like a page. */
  css: z.string().default(''),
  checks: z.array(Check).min(1).max(16),
});

export type SpecCheckerProps = z.infer<typeof SpecCheckerPropsSchema>;

export default {
  id: 'spec-checker',
  props: SpecCheckerPropsSchema,
} satisfies VisualizerBuild<SpecCheckerProps>;
