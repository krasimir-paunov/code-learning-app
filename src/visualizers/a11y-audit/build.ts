import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Check = z.discriminatedUnion('kind', [
  /** Measured: the text's contrast with the background it sits on. */
  z.strictObject({
    kind: z.literal('contrast'),
    selector: z.string().min(1),
    min: z.number().min(1).max(21),
  }),
  /** Measured: the control has an accessible name. */
  z.strictObject({ kind: z.literal('name'), selector: z.string().min(1) }),
  /** Seen, not measured: the learner checks it with one of the views. */
  z.strictObject({ kind: z.literal('look'), how: z.string().min(1) }),
]);

export const A11yAuditPropsSchema = z.strictObject({
  html: z.string().min(1),
  /** The page's styles, problems included. */
  css: z.string().min(1),
  issues: z
    .array(z.strictObject({ title: z.string().min(1), fix: z.string().min(1), check: Check }))
    .min(1)
    .max(5),
  /** The control the "move focus here" button focuses. */
  focusTarget: z.string().min(1),
});

export type A11yAuditProps = z.infer<typeof A11yAuditPropsSchema>;

export default {
  id: 'a11y-audit',
  props: A11yAuditPropsSchema,
} satisfies VisualizerBuild<A11yAuditProps>;
