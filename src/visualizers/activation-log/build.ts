import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const ActivationLogPropsSchema = z.strictObject({
  /** Visible text for each element on the stage. */
  labels: z.strictObject({
    link: z.string().min(1),
    submit: z.string().min(1),
    button: z.string().min(1),
    div: z.string().min(1),
  }),
  href: z.string().startsWith('/'),
});

export type ActivationLogProps = z.infer<typeof ActivationLogPropsSchema>;

export default {
  id: 'activation-log',
  props: ActivationLogPropsSchema,
} satisfies VisualizerBuild<ActivationLogProps>;
