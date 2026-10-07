import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Constraint = z.strictObject({
  attr: z.enum(['required', 'pattern', 'minlength', 'maxlength', 'min', 'max', 'step']),
  value: z.string().optional(),
});

export const ValidationLabPropsSchema = z.strictObject({
  fields: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        name: z.string().regex(/^[a-z][\w-]*$/),
        type: z.enum(['text', 'email', 'url', 'number', 'password']),
        constraints: z.array(Constraint).min(1).max(4),
      }),
    )
    .min(1)
    .max(3),
});

export type ValidationLabProps = z.infer<typeof ValidationLabPropsSchema>;

export default {
  id: 'validation-lab',
  props: ValidationLabPropsSchema,
} satisfies VisualizerBuild<ValidationLabProps>;
