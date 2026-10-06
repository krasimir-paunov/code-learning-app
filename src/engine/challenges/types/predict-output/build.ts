import { z } from 'zod';
import type { ChallengeBuild } from '../../build-contract.ts';
import {
  challengeShape,
  CodeRefSchema,
  escapeHtml,
  VerifySchema,
} from '../../shared/build-helpers.ts';
import { normalizeOutput } from '../../shared/normalize.ts';
import type { PredictOutputSpec } from './index.ts';

const schema = z
  .strictObject({
    ...challengeShape('predict-output'),
    code: CodeRefSchema,
    /** Must equal real stdout: verify:snippets executes the code and compares. */
    answer: z.string().min(1),
    choices: z.array(z.string().min(1)).min(2).max(6).optional(),
    verify: VerifySchema.exclude(['none']),
  })
  .refine(
    (c) => !c.choices || c.choices.some((x) => normalizeOutput(x) === normalizeOutput(c.answer)),
    '`choices` must include the answer',
  );

type Authored = z.infer<typeof schema>;

export default {
  type: 'predict-output',
  defaultXp: 10,
  schema,
  compile: (c, ctx) => {
    const source = ctx.source(c.code);
    return {
      code: ctx.codeBlock({ tabs: [{ lang: c.code.lang, inline: source }] }),
      answer: c.answer.replace(/\n$/, ''),
      ...(c.choices && { choices: c.choices }),
    };
  },
  solution: (c) => `<pre>${escapeHtml(c.answer.replace(/\n$/, ''))}</pre>`,
  claims: (c, ctx) => [
    {
      code: ctx.source(c.code),
      lang: c.code.lang,
      verify: c.verify,
      expected: c.answer,
      where: 'answer',
    },
  ],
} satisfies ChallengeBuild<Authored, PredictOutputSpec>;
