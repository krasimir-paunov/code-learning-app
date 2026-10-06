/**
 * Authored lesson format (content/lessons/<track>/<slug>/lesson.yaml), validated at build time.
 * Build-time only: the app ships compiled lessons (lesson-types.ts), never these schemas.
 */
import { z } from 'zod';
import { CODE_LANGS } from './code.ts';
import { IdSchema } from './curriculum-schema.ts';

export const VERIFY_KINDS = ['node', 'browser', 'dotnet', 'dotnet-build', 'tsc', 'none'] as const;
export type VerifyKind = (typeof VERIFY_KINDS)[number];

/** Markdown restricted to emphasis, inline code, links, lists and fenced code. */
export const MarkdownSchema = z.string().min(1);

/** Code comes from a real file (preferred: it is executed) or a short inline string. */
export const CodeSourceSchema = z.union([
  z.strictObject({ file: z.string().min(1) }),
  z.strictObject({ inline: z.string().min(1) }),
]);

export const CodeTabSchema = z
  .strictObject({
    lang: z.enum(CODE_LANGS),
    file: z.string().min(1).optional(),
    inline: z.string().min(1).optional(),
    /** A claim: verify:snippets runs the code and compares stdout. */
    output: z.string().optional(),
    verify: z.enum(VERIFY_KINDS).optional(),
    why: z.string().min(1).optional(),
    /** Expected compiler diagnostics (verify: tsc), so learners see the compiler's own words. */
    expectErrors: z.array(z.object({ code: z.string(), message: z.string() })).optional(),
  })
  .refine((t) => (t.file === undefined) !== (t.inline === undefined), {
    message: 'a code tab needs exactly one of `file` or `inline`',
  })
  .refine((t) => t.output === undefined || t.verify !== undefined, {
    message: 'a tab with `output` must say how it is verified (`verify`)',
  })
  .refine((t) => t.verify !== 'none' || t.why !== undefined, {
    message: '`verify: none` requires a written `why`',
  });

export const CodeBlockSchema = z.strictObject({
  caption: z.string().optional(),
  tabs: z.array(CodeTabSchema).min(1),
});

export type CodeTab = z.infer<typeof CodeTabSchema>;
export type CodeBlock = z.infer<typeof CodeBlockSchema>;

/** Fields every challenge has; each type adds its own (validated by the type's schema). */
export const ChallengeBaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'challenge ids are kebab-case'),
  type: z.string().min(1),
  prompt: MarkdownSchema,
  hints: z.array(MarkdownSchema).default([]),
  explanation: MarkdownSchema,
  xp: z.number().int().min(1).max(200).optional(),
});
export type ChallengeBase = z.infer<typeof ChallengeBaseSchema>;

export const LessonSchema = z.strictObject({
  id: IdSchema,
  version: z.number().int().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  minutes: z.number().int().min(3).max(10),
  tags: z.array(z.string()).default([]),
  concept: z.strictObject({
    title: z.string().min(1),
    body: MarkdownSchema,
    code: CodeBlockSchema.optional(),
  }),
  playground: z.strictObject({
    visualizer: z.string().min(1),
    props: z.unknown(),
    /** The 30-second hook: what to try first. */
    prompt: MarkdownSchema,
    explore: z.array(MarkdownSchema).default([]),
  }),
  challenges: z.array(ChallengeBaseSchema.loose()).min(1),
  production: z
    .array(
      z.strictObject({
        title: z.string().min(1),
        body: MarkdownSchema,
        code: CodeBlockSchema.optional(),
      }),
    )
    .min(1)
    .max(3),
  mistake: z.strictObject({
    title: z.string().min(1),
    body: MarkdownSchema,
    bad: CodeBlockSchema.optional(),
    fix: MarkdownSchema,
    good: CodeBlockSchema.optional(),
  }),
  recap: z.array(MarkdownSchema).min(2).max(3),
  related: z.array(IdSchema).default([]),
});
export type Lesson = z.infer<typeof LessonSchema>;
