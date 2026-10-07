import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const FormInspectorPropsSchema = z.strictObject({
  action: z.string().startsWith('/'),
  method: z.enum(['get', 'post']).default('get'),
  fields: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        name: z.string().regex(/^[a-z][\w-]*$/),
        type: z.enum(['text', 'email', 'search', 'checkbox', 'number']),
        value: z.string().default(''),
        /** The learner can switch this field's name attribute off. */
        nameToggle: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(5),
  submit: z.strictObject({ label: z.string().min(1) }),
});

export type FormInspectorProps = z.infer<typeof FormInspectorPropsSchema>;

export default {
  id: 'form-inspector',
  props: FormInspectorPropsSchema,
} satisfies VisualizerBuild<FormInspectorProps>;
