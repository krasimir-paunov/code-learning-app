import { z } from 'zod';
import type { ChallengeBuild } from '../../build-contract.ts';
import { challengeShape, CodeRefSchema, SourceSchema } from '../../shared/build-helpers.ts';
import type { FindBugSpec } from './index.ts';

const schema = z
  .strictObject({
    ...challengeShape('find-bug'),
    code: CodeRefSchema,
    /** 1-based lines that contain the bug (contiguous when more than one). */
    bugLines: z.array(z.number().int().min(1)).min(1),
    fix: z.union([
      z.strictObject({
        choices: z
          .array(z.strictObject({ text: z.string().min(1), correct: z.boolean().default(false) }))
          .min(2)
          .max(5),
      }),
      z.strictObject({ accept: z.array(z.string().min(1)).min(1) }),
    ]),
    /**
     * Tests (shared harness): the build proves the correct fix passes and every distractor and
     * the bug fail. JavaScript runs in Node; HTML and CSS run in the browser sandbox.
     */
    tests: SourceSchema.optional(),
    /** The page a CSS snippet styles (required for CSS tests). */
    page: SourceSchema.optional(),
  })
  .refine(
    (c) => !('choices' in c.fix) || c.fix.choices.filter((x) => x.correct).length === 1,
    'fix.choices needs exactly one correct choice',
  )
  .refine((c) => !c.tests || c.code.lang !== 'css' || c.page, '`tests` on CSS need a `page`')
  .refine((c) => !c.page || c.code.lang === 'css', '`page` is only for CSS snippets');

type Authored = z.infer<typeof schema>;

/** Replaces the bug lines with `replacement` (which may span several lines). */
export function applyFix(source: string, bugLines: number[], replacement: string): string {
  const lines = source.split('\n');
  const first = Math.min(...bugLines) - 1;
  const count = Math.max(...bugLines) - first;
  const indent = /^\s*/.exec(lines[first] ?? '')?.[0] ?? '';
  const replaced = replacement
    .split('\n')
    .map((l, i) => (i === 0 || l ? indent + l.trimStart() : l));
  lines.splice(first, count, ...replaced);
  return lines.join('\n');
}

function correctText(c: Authored): string {
  return 'choices' in c.fix
    ? (c.fix.choices.find((x) => x.correct)?.text ?? '')
    : (c.fix.accept[0] ?? '');
}

export default {
  type: 'find-bug',
  defaultXp: 15,
  schema,
  compile(c, ctx) {
    const source = ctx.source(c.code);
    const lineCount = source.replace(/\n$/, '').split('\n').length;
    const bad = c.bugLines.filter((l) => l > lineCount);
    if (bad.length)
      throw new Error(`bugLines ${bad.join(', ')} are beyond the ${lineCount}-line snippet`);
    const sorted = [...c.bugLines].sort((a, b) => a - b);
    if (sorted.some((l, i) => i > 0 && l !== (sorted[i - 1] as number) + 1)) {
      throw new Error('bugLines must be contiguous');
    }
    return {
      lines: ctx.highlightLines(source, c.code.lang),
      bugLines: sorted,
      fix:
        'choices' in c.fix
          ? {
              kind: 'choices',
              choices: c.fix.choices.map((x) => ({ html: ctx.highlight(x.text, c.code.lang) })),
              correct: c.fix.choices.findIndex((x) => x.correct),
            }
          : { kind: 'accept', accept: c.fix.accept },
    } satisfies FindBugSpec;
  },
  solution: (c, ctx) =>
    `<p>Line ${c.bugLines.join(', ')}. Replace it with:</p>${ctx.highlight(correctText(c), c.code.lang)}`,
  async buildCheck(c, ctx) {
    if (!c.tests) return [];
    const lang = c.code.lang;
    if (lang !== 'js' && lang !== 'html' && lang !== 'css')
      return ['find-bug `tests` support JavaScript, HTML and CSS'];
    const source = ctx.source(c.code);
    const tests = ctx.source(c.tests);
    const page = c.page ? ctx.source(c.page) : '';
    const problems: string[] = [];
    const run = (code: string) => {
      if (lang === 'js') return ctx.runJs({ 'main.js': code }, tests);
      const files: Record<string, string> =
        lang === 'html' ? { 'index.html': code } : { 'index.html': page, 'style.css': code };
      return ctx.runInBrowser({ files, tests });
    };
    const passesAll = async (code: string) => {
      const result = await run(code);
      return (
        result.status === 'ok' && result.tests.length > 0 && result.tests.every((t) => t.passed)
      );
    };
    if (await passesAll(source))
      problems.push('the buggy code passes every test; the tests do not catch the bug');
    const candidates =
      'choices' in c.fix
        ? c.fix.choices.map((x) => ({ text: x.text, correct: x.correct }))
        : [{ text: correctText(c), correct: true }];
    for (const candidate of candidates) {
      const passes = await passesAll(applyFix(source, c.bugLines, candidate.text));
      if (candidate.correct && !passes)
        problems.push(`the correct fix "${candidate.text}" fails the tests`);
      if (!candidate.correct && passes)
        problems.push(`distractor "${candidate.text}" passes the tests`);
    }
    return problems;
  },
} satisfies ChallengeBuild<Authored, FindBugSpec>;
