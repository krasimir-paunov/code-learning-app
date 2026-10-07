import { z } from 'zod';
import type { ChallengeBuild } from '../../build-contract.ts';
import { challengeShape, SourceSchema } from '../../shared/build-helpers.ts';
import { compareLayouts, type Viewport, type VisualMatchSpec } from './index.ts';

const ViewportSchema = z.strictObject({
  width: z.number().int().min(200).max(1024),
  height: z.number().int().min(120).max(800),
});

const schema = z
  .strictObject({
    ...challengeShape('visual-match'),
    html: SourceSchema,
    starterCss: SourceSchema,
    targetCss: SourceSchema,
    compare: z.strictObject({
      selectors: z.array(z.string().min(1)).min(1),
      tolerancePx: z.number().min(0).max(10).default(2),
      properties: z.array(z.string().min(1)).default([]),
    }),
    /** Both pages are rendered and measured at exactly this size (default 320×240). */
    viewport: ViewportSchema.optional(),
    /** Responsive challenges: the page must match at every one of these sizes. */
    viewports: z.array(ViewportSchema).min(2).max(3).optional(),
  })
  .refine((c) => !(c.viewport && c.viewports), {
    message: 'use either viewport or viewports, not both',
  });

type Authored = z.infer<typeof schema>;

const sizes = (c: Authored): Viewport[] =>
  c.viewports ?? [c.viewport ?? { width: 320, height: 240 }];

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
      viewports: sizes(c),
    }) satisfies VisualMatchSpec,
  solution: (c, ctx) => ctx.highlight(ctx.source(c.targetCss), 'css'),
  async buildCheck(c, ctx) {
    const html = ctx.source(c.html);
    const measure = { selectors: c.compare.selectors, properties: c.compare.properties };
    const run = (css: string, viewport: Viewport) =>
      ctx.runInBrowser({ files: { 'index.html': html, 'style.css': css }, measure, viewport });
    const problems: string[] = [];
    let starterMatchesEverywhere = true;
    for (const viewport of sizes(c)) {
      const at = c.viewports ? ` at ${viewport.width}px` : '';
      const target = await run(ctx.source(c.targetCss), viewport);
      const starter = await run(ctx.source(c.starterCss), viewport);
      for (const selector of c.compare.selectors) {
        if (!target.measurements?.[selector]?.found)
          problems.push(`selector "${selector}" matches nothing in the target${at}`);
      }
      const t = target.measurements ?? {};
      const self = compareLayouts(t, t, c.compare);
      if (!self.passed) problems.push(`the target does not match itself${at}: ${self.feedback}`);
      if (!compareLayouts(t, starter.measurements ?? {}, c.compare).passed)
        starterMatchesEverywhere = false;
    }
    if (starterMatchesEverywhere) problems.push('the starter CSS already matches the target');
    return problems;
  },
} satisfies ChallengeBuild<Authored, VisualMatchSpec>;
