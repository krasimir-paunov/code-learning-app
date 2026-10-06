import { z } from 'zod';
import type { ChallengeBuild } from '../../build-contract.ts';
import { challengeShape, SourceSchema } from '../../shared/build-helpers.ts';
import { compareLayouts, type VisualMatchSpec } from './index.ts';

const schema = z.strictObject({
  ...challengeShape('visual-match'),
  html: SourceSchema,
  starterCss: SourceSchema,
  targetCss: SourceSchema,
  compare: z.strictObject({
    selectors: z.array(z.string().min(1)).min(1),
    tolerancePx: z.number().min(0).max(10).default(2),
    properties: z.array(z.string().min(1)).default([]),
  }),
  /** Both pages are rendered and measured at exactly this size. */
  viewport: z
    .strictObject({
      width: z.number().int().min(200).max(800),
      height: z.number().int().min(120).max(800),
    })
    .default({ width: 320, height: 240 }),
});

type Authored = z.infer<typeof schema>;

export default {
  type: 'visual-match',
  defaultXp: 20,
  schema,
  compile: (c, ctx) =>
    ({
      html: ctx.source(c.html),
      starterCss: ctx.source(c.starterCss),
      targetCss: ctx.source(c.targetCss),
      compare: c.compare,
      viewport: c.viewport,
    }) satisfies VisualMatchSpec,
  solution: (c, ctx) => ctx.highlight(ctx.source(c.targetCss), 'css'),
  async buildCheck(c, ctx) {
    const html = ctx.source(c.html);
    const measure = { selectors: c.compare.selectors, properties: c.compare.properties };
    const run = (css: string) =>
      ctx.runInBrowser({
        files: { 'index.html': html, 'style.css': css },
        measure,
        viewport: c.viewport,
      });
    const target = await run(ctx.source(c.targetCss));
    const starter = await run(ctx.source(c.starterCss));
    const problems: string[] = [];
    for (const selector of c.compare.selectors) {
      if (!target.measurements?.[selector]?.found)
        problems.push(`selector "${selector}" matches nothing in the target`);
    }
    const self = compareLayouts(target.measurements ?? {}, target.measurements ?? {}, c.compare);
    if (!self.passed) problems.push(`the target does not match itself: ${self.feedback}`);
    const start = compareLayouts(target.measurements ?? {}, starter.measurements ?? {}, c.compare);
    if (start.passed) problems.push('the starter CSS already matches the target');
    return problems;
  },
} satisfies ChallengeBuild<Authored, VisualMatchSpec>;
