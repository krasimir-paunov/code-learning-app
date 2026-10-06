import { z } from 'zod';
import type { ChallengeBuild } from '../../build-contract.ts';
import {
  challengeShape,
  CodeRefSchema,
  escapeHtml,
  VerifySchema,
} from '../../shared/build-helpers.ts';
import type { FillBlankSpec } from './index.ts';
import { sentinel, splitLine } from './segments.ts';

const MARKER = /\[\[([a-z][a-z0-9-]*)\]\]/g;

const schema = z.strictObject({
  ...challengeShape('fill-blank'),
  /** Code with [[name]] markers where the blanks go. */
  code: CodeRefSchema,
  blanks: z.record(
    z.string().regex(/^[a-z][a-z0-9-]*$/),
    z.strictObject({
      accept: z.array(z.string().min(1)).min(1),
      caseSensitive: z.boolean().default(true),
      /** Spoken with the blank's number, e.g. "content width". */
      label: z.string().optional(),
    }),
  ),
  /**
   * Optional proof that the accepted answers do what the prompt claims: a runnable file with the
   * same [[name]] markers; the build fills in each blank's first accepted value, runs it and
   * compares the output.
   */
  check: z
    .strictObject({
      file: z.string().min(1),
      output: z.string(),
      verify: VerifySchema.exclude(['none']),
    })
    .optional(),
});

type Authored = z.infer<typeof schema>;

function markersIn(code: string): string[] {
  return [...code.matchAll(MARKER)].map((m) => m[1] as string);
}

function fill(code: string, c: Authored): string {
  return code.replace(MARKER, (_, name: string) => c.blanks[name]?.accept[0] ?? '');
}

export default {
  type: 'fill-blank',
  defaultXp: 10,
  schema,
  compile(c, ctx) {
    const source = ctx.source(c.code);
    const order = markersIn(source);
    const declared = Object.keys(c.blanks);
    const missing = declared.filter((n) => !order.includes(n));
    const undeclared = order.filter((n) => !declared.includes(n));
    const repeated = order.filter((n, i) => order.indexOf(n) !== i);
    if (missing.length || undeclared.length || repeated.length) {
      throw new Error(
        `blanks and [[markers]] must match one-to-one (missing markers: ${missing.join(', ') || '-'}; undeclared: ${undeclared.join(', ') || '-'}; repeated: ${repeated.join(', ') || '-'})`,
      );
    }
    const withSentinels = source.replace(MARKER, (_, name: string) => sentinel(name));
    const lines = ctx
      .highlightLines(withSentinels, c.code.lang)
      .map((line) => splitLine(line, order));
    const found = lines.flat().filter((s) => 'blank' in s).length;
    if (found !== order.length)
      throw new Error('a blank marker was split by the highlighter; move it to a whole token');
    return {
      lines,
      blanks: order.map((name, i) => {
        const blank = c.blanks[name] as Authored['blanks'][string];
        return {
          name,
          label: `Blank ${i + 1} of ${order.length}${blank.label ? `: ${blank.label}` : ''}`,
          accept: blank.accept,
          caseSensitive: blank.caseSensitive,
          size: Math.max(4, ...blank.accept.map((a) => a.length + 2)),
        };
      }),
    } satisfies FillBlankSpec;
  },
  solution: (c, ctx) => `<pre>${escapeHtml(fill(ctx.source(c.code), c))}</pre>`,
  claims(c, ctx) {
    if (!c.check) return [];
    const template = ctx.read(c.check.file);
    const lang = c.check.file.split('.').pop() ?? 'text';
    return [
      {
        code: fill(template, c),
        lang,
        verify: c.check.verify,
        expected: c.check.output,
        where: `check (${c.check.file})`,
      },
    ];
  },
} satisfies ChallengeBuild<Authored, FillBlankSpec>;
