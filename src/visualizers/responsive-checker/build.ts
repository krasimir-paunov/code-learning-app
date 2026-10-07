import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import type { Measurement } from '../../engine/runners/contract.ts';
import { measureFor, rendersFor, renderKey, runAll, withTheme, type Check } from './model.ts';

const scope = {
  label: z.string().min(1),
  at: z.array(z.number().int()).min(1).optional(),
  theme: z.enum(['light', 'dark']).optional(),
};
const CheckSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('stacked'), ...scope, a: z.string(), b: z.string() }),
  z.strictObject({ kind: z.literal('row'), ...scope, a: z.string(), b: z.string() }),
  z.strictObject({ kind: z.literal('fits'), ...scope, selector: z.string() }),
  z.strictObject({
    kind: z.literal('max-width'),
    ...scope,
    selector: z.string(),
    max: z.number().positive(),
  }),
  z.strictObject({
    kind: z.literal('style'),
    ...scope,
    selector: z.string(),
    property: z.string().min(1),
    value: z.string().min(1),
  }),
]);

export const ResponsiveCheckerPropsSchema = z
  .strictObject({
    /** The page body; its root carries data-theme="light" when any check is themed. */
    html: z.string().min(1),
    /** The CSS the learner starts from and edits. */
    css: z.string().min(1),
    /** A reference solution: verify:snippets proves it meets every check. */
    solution: z.string().min(1),
    widths: z.array(z.number().int().min(320).max(1440)).min(2).max(3),
    height: z.number().int().min(240).max(900).default(560),
    checks: z.array(CheckSchema).min(1).max(16),
  })
  .superRefine((p, ctx) => {
    p.checks.forEach((check, i) => {
      for (const width of check.at ?? []) {
        if (!p.widths.includes(width))
          ctx.addIssue({
            code: 'custom',
            path: ['checks', i, 'at'],
            message: `${width} is not in widths`,
          });
      }
    });
    if (p.checks.some((c) => c.theme === 'dark') && !p.html.includes('data-theme="light"'))
      ctx.addIssue({
        code: 'custom',
        path: ['html'],
        message: 'themed checks need data-theme="light" on the root',
      });
  });

export type ResponsiveCheckerProps = z.infer<typeof ResponsiveCheckerPropsSchema>;

export default {
  id: 'responsive-checker',
  props: ResponsiveCheckerPropsSchema,
  async buildCheck(props, ctx) {
    const checks: Check[] = props.checks;
    const measure = measureFor(checks);
    const measureAll = async (css: string) => {
      const results = new Map<string, Record<string, Measurement>>();
      for (const render of rendersFor(checks, props.widths)) {
        const run = await ctx.runInBrowser({
          files: { 'index.html': withTheme(props.html, render.theme), 'style.css': css },
          measure,
          viewport: { width: render.width, height: props.height },
        });
        results.set(renderKey(render), run.measurements ?? {});
      }
      return runAll(checks, props.widths, results);
    };
    const problems: string[] = [];
    const solved = await measureAll(props.solution);
    solved.forEach((row, i) => {
      for (const [width, outcome] of row ?? []) {
        if (!outcome.pass)
          problems.push(
            `the solution fails "${checks[i]?.label}" at ${width}px: ${outcome.detail}`,
          );
      }
    });
    const started = await measureAll(props.css);
    if (started.every((row) => [...(row?.values() ?? [])].every((o) => o.pass)))
      problems.push('the starter CSS already meets every check');
    return problems;
  },
} satisfies VisualizerBuild<ResponsiveCheckerProps>;
