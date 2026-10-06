/** Build-time helpers shared by challenge build plugins. */
import { z } from 'zod';
import { CODE_LANGS } from '../../content/code.ts';
import { ChallengeBaseSchema, VERIFY_KINDS } from '../../content/lesson-schema.ts';

/** The base fields plus the type literal; each type spreads its own fields in. */
export function challengeShape<T extends string>(type: T) {
  return { ...ChallengeBaseSchema.shape, type: z.literal(type) };
}

export const SourceSchema = z.union([
  z.strictObject({ file: z.string().min(1) }),
  z.strictObject({ inline: z.string().min(1) }),
]);
export type Source = z.infer<typeof SourceSchema>;

export const CodeRefSchema = z.union([
  z.strictObject({ lang: z.enum(CODE_LANGS), file: z.string().min(1) }),
  z.strictObject({ lang: z.enum(CODE_LANGS), inline: z.string().min(1) }),
]);
export type CodeRef = z.infer<typeof CodeRefSchema>;

export const VerifySchema = z.enum(VERIFY_KINDS);

export function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
