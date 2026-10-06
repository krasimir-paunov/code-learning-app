import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Rule = z.strictObject({
  selector: z.string(),
  declarations: z.array(z.strictObject({ property: z.string(), value: z.string() })).max(6),
});

export const RuleAnatomyPropsSchema = z.strictObject({
  /** The page the rule styles (author content). */
  html: z.string().min(1),
  /** Base styles of the page, applied before the learner's rule. */
  baseCss: z.string().default(''),
  presets: z
    .array(z.strictObject({ label: z.string().min(1), rule: Rule }))
    .min(1)
    .max(6),
});

export type RuleAnatomyProps = z.infer<typeof RuleAnatomyPropsSchema>;

export default {
  id: 'rule-anatomy',
  props: RuleAnatomyPropsSchema,
} satisfies VisualizerBuild<RuleAnatomyProps>;
