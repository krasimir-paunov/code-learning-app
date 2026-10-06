/**
 * Cheat sheets (content/cheatsheets/<track>.yaml), validated at build time. Original content
 * only; any entry that states a result is executed by verify:snippets.
 */
import { z } from 'zod';
import { USAGE } from './cheatsheet-types.ts';
import { CODE_LANGS } from './code.ts';
import { IdSchema } from './curriculum-schema.ts';
import { VERIFY_KINDS } from './lesson-schema.ts';

const EntryBase = {
  /** Permanent: used for deep links (#css.sheet.flex-center). */
  id: z
    .string()
    .regex(/^[a-z]+\.sheet\.[a-z0-9]+(-[a-z0-9]+)*$/, 'ids look like "track.sheet.slug"'),
  title: z.string().min(1),
  /** One line. */
  explain: z.string().min(1).max(220),
  usage: z.enum(USAGE),
  /** Lesson that teaches it; the link appears only once that lesson is published. */
  learn: IdSchema.optional(),
  /** Still common in real codebases, but not the modern way. */
  legacy: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
};

const CodeEntrySchema = z
  .strictObject({
    ...EntryBase,
    kind: z.literal('code').default('code'),
    code: z.strictObject({ lang: z.enum(CODE_LANGS), inline: z.string().min(1) }),
    /** Hidden code appended when verifying (e.g. a console.log of the result). */
    check: z.string().optional(),
    output: z.string().optional(),
    verify: z.enum(VERIFY_KINDS).optional(),
    why: z.string().optional(),
  })
  .refine((e) => e.output === undefined || (e.verify !== undefined && e.verify !== 'none'), {
    message: 'an entry with `output` needs a `verify` kind that executes it',
  })
  .refine((e) => e.verify !== 'none' || e.why !== undefined, {
    message: '`verify: none` requires a written `why`',
  });

const TableEntrySchema = z
  .strictObject({
    ...EntryBase,
    kind: z.literal('table'),
    columns: z.array(z.string().min(1)).min(2),
    rows: z.array(z.array(z.string())).min(1),
    notes: z.array(z.string()).default([]),
  })
  .refine((t) => t.rows.every((row) => row.length === t.columns.length), {
    message: 'every table row needs exactly one cell per column',
  });

export const CheatSheetSchema = z.strictObject({
  track: z.string().regex(/^[a-z]+$/),
  title: z.string().min(1),
  intro: z.string().optional(),
  sections: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
        title: z.string().min(1),
        entries: z.array(z.union([TableEntrySchema, CodeEntrySchema])).min(1),
      }),
    )
    .min(1),
});

export type CheatSheet = z.infer<typeof CheatSheetSchema>;
export type CheatSheetEntry = CheatSheet['sections'][number]['entries'][number];
