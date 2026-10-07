import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const AriaWorkbenchPropsSchema = z.strictObject({
  widgets: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        /** Trusted markup for the widget. */
        html: z.string().min(1),
        /** The element whose accessibility information is shown. */
        inspect: z.string().min(1),
        toggles: z
          .array(
            z.strictObject({
              label: z.string().min(1),
              selector: z.string().min(1),
              attr: z.string().regex(/^(aria-[a-z]+|role)$/),
              value: z.string(),
            }),
          )
          .min(1)
          .max(3),
        /** Built-in behaviour: a disclosure button, or a button that updates a status message. */
        behavior: z.enum(['disclosure', 'status']).optional(),
      }),
    )
    .min(1)
    .max(5),
});

export type AriaWorkbenchProps = z.infer<typeof AriaWorkbenchPropsSchema>;

export default {
  id: 'aria-workbench',
  props: AriaWorkbenchPropsSchema,
} satisfies VisualizerBuild<AriaWorkbenchProps>;
