import { z } from 'zod';
import type { ChallengeBuild } from '../../build-contract.ts';
import { challengeShape } from '../../shared/build-helpers.ts';
import type { ChoiceSpec } from './index.ts';

const schema = z
  .strictObject({
    ...challengeShape('choice'),
    options: z
      .array(
        z.strictObject({
          text: z.string().min(1),
          correct: z.boolean().default(false),
          /** Every option explains itself (shown once it is judged). */
          why: z.string().min(1),
        }),
      )
      .min(2)
      .max(8),
    multiple: z.boolean().default(false),
  })
  .refine((c) => c.options.some((o) => o.correct), 'at least one option must be correct')
  .refine(
    (c) => c.multiple || c.options.filter((o) => o.correct).length === 1,
    'a single-choice question needs exactly one correct option (or set `multiple: true`)',
  );

type Authored = z.infer<typeof schema>;

export default {
  type: 'choice',
  defaultXp: 5,
  schema,
  compile: (c, ctx) => ({
    options: c.options.map((o) => ({
      html: ctx.inlineMarkdown(o.text),
      whyHtml: ctx.inlineMarkdown(o.why),
    })),
    multiple: c.multiple,
    correct: c.options.flatMap((o, i) => (o.correct ? [i] : [])),
  }),
  solution: (c, ctx) =>
    `<ul>${c.options
      .filter((o) => o.correct)
      .map((o) => `<li>${ctx.inlineMarkdown(o.text)}: ${ctx.inlineMarkdown(o.why)}</li>`)
      .join('')}</ul>`,
} satisfies ChallengeBuild<Authored, ChoiceSpec>;
