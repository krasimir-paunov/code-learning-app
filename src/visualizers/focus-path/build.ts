import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Toggle = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('attr'),
    label: z.string().min(1),
    selector: z.string().min(1),
    attr: z.string().min(1),
    value: z.string(),
  }),
  z.strictObject({ kind: z.literal('css'), label: z.string().min(1), css: z.string().min(1) }),
]);

export const FocusPathPropsSchema = z.strictObject({
  /** Trusted page markup; every focusable element in it becomes a stop on the path. */
  html: z.string().min(1),
  css: z.string().default(''),
  toggles: z.array(Toggle).min(1).max(4),
});

export type FocusPathProps = z.infer<typeof FocusPathPropsSchema>;

export default {
  id: 'focus-path',
  props: FocusPathPropsSchema,
} satisfies VisualizerBuild<FocusPathProps>;
