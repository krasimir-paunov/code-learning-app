import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

export const ThemeSwitcherPropsSchema = z.strictObject({
  /** Trusted markup for the mini interface. */
  html: z.string().min(1),
  /** Rules that only declare custom properties; later rules must also be the stronger ones. */
  rules: z
    .array(
      z.strictObject({
        selector: z.string().min(1),
        declarations: z
          .array(z.strictObject({ name: z.string().regex(/^--[\w-]+$/), value: z.string().min(1) }))
          .min(1),
      }),
    )
    .min(1),
  /** The rules that read the variables with var(); shown read-only. */
  usage: z.string().min(1),
  /** Layout styling that has nothing to do with the variables; applied but not shown. */
  baseCss: z.string().default(''),
  theme: z.strictObject({
    selector: z.string().min(1),
    attribute: z.string().regex(/^data-[a-z-]+$/),
    values: z.array(z.string().min(1)).min(2).max(3),
  }),
  /** Elements the learner can inspect. */
  targets: z
    .array(z.strictObject({ label: z.string().min(1), selector: z.string().min(1) }))
    .min(1),
});

export type ThemeSwitcherProps = z.infer<typeof ThemeSwitcherPropsSchema>;

export default {
  id: 'theme-switcher',
  props: ThemeSwitcherPropsSchema,
} satisfies VisualizerBuild<ThemeSwitcherProps>;
