import { z } from 'zod';
import type { BuildCheckContext, ChallengeBuild } from '../../build-contract.ts';
import { challengeShape, SourceSchema } from '../../shared/build-helpers.ts';
import type { LiveCodeSpec } from './index.ts';

const FileName = z.string().regex(/^[\w-]+\.(html|css|js)$/);

const schema = z.strictObject({
  ...challengeShape('live-code'),
  runner: z.literal('web-sandbox'),
  files: z.record(
    FileName,
    z.intersection(SourceSchema, z.object({ editable: z.boolean().default(true) })),
  ),
  solution: z.record(FileName, SourceSchema),
  /** Tests run after the learner's code with the shared harness (test/expect). */
  tests: SourceSchema,
});

type Authored = z.infer<typeof schema>;

const langOf = (name: string) => name.split('.').pop() ?? 'text';

function sources(
  files: Record<string, { file?: string; inline?: string }>,
  ctx: { source(s: { file?: string; inline?: string }): string },
) {
  return Object.fromEntries(Object.entries(files).map(([name, src]) => [name, ctx.source(src)]));
}

async function run(files: Record<string, string>, tests: string, ctx: BuildCheckContext) {
  const jsOnly = Object.keys(files).every((name) => name.endsWith('.js'));
  return jsOnly ? ctx.runJs(files, tests) : ctx.runInBrowser({ files, tests });
}

export default {
  type: 'live-code',
  defaultXp: 20,
  schema,
  compile(c, ctx) {
    const solutionNames = Object.keys(c.solution);
    const unknown = solutionNames.filter((n) => !(n in c.files));
    if (unknown.length)
      throw new Error(`solution files ${unknown.join(', ')} are not among the starting files`);
    const names = Object.keys(c.files);
    return {
      runner: c.runner,
      files: sources(c.files, ctx),
      editable: names.filter((n) => c.files[n]?.editable !== false),
      tests: ctx.source(c.tests),
      preview: names.some((n) => n.endsWith('.html') || n.endsWith('.css')),
    } satisfies LiveCodeSpec;
  },
  solution: (c, ctx) =>
    Object.entries(c.solution)
      .map(
        ([name, src]) =>
          `<p><code>${name}</code></p>${ctx.highlight(ctx.source(src), langOf(name))}`,
      )
      .join(''),
  async buildCheck(c, ctx) {
    const starter = sources(c.files, ctx);
    const solved = { ...starter, ...sources(c.solution, ctx) };
    const tests = ctx.source(c.tests);
    const problems: string[] = [];
    const solution = await run(solved, tests, ctx);
    if (
      solution.status !== 'ok' ||
      solution.tests.length === 0 ||
      solution.tests.some((t) => !t.passed)
    ) {
      const failing = solution.tests.filter((t) => !t.passed).map((t) => `${t.name}: ${t.message}`);
      problems.push(
        `the solution does not pass the tests (${solution.status}${failing.length ? `; ${failing.join('; ')}` : ''}${solution.diagnostics[0] ? `; ${solution.diagnostics[0].message}` : ''})`,
      );
    }
    const start = await run(starter, tests, ctx);
    if (start.status === 'ok' && start.tests.length > 0 && start.tests.every((t) => t.passed)) {
      problems.push('the starter already passes every test');
    }
    return problems;
  },
} satisfies ChallengeBuild<Authored, LiveCodeSpec>;
