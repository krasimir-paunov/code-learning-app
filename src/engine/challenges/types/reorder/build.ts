import { z } from 'zod';
import { CODE_LANGS } from '../../../content/code.ts';
import type { ChallengeBuild } from '../../build-contract.ts';
import { challengeShape, escapeHtml } from '../../shared/build-helpers.ts';
import type { ReorderSpec } from './index.ts';

const schema = z
  .strictObject({
    ...challengeShape('reorder'),
    /** The correct order. */
    items: z.array(z.string().min(1)).min(2).max(10),
    distractors: z.array(z.string().min(1)).max(4).default([]),
    /** Other valid orders, written with the same item texts. */
    alternatives: z.array(z.array(z.string().min(1))).default([]),
    /** Items are code lines in this language (otherwise inline Markdown). */
    lang: z.enum(CODE_LANGS).optional(),
  })
  .refine(
    (c) => new Set([...c.items, ...c.distractors]).size === c.items.length + c.distractors.length,
    {
      message: 'items and distractors must all be different',
    },
  )
  .refine(
    (c) =>
      c.alternatives.every(
        (alt) => alt.length === c.items.length && alt.every((x) => c.items.includes(x)),
      ),
    { message: 'every alternative must reorder exactly the same items' },
  );

type Authored = z.infer<typeof schema>;

/** Deterministic shuffle (seeded by the challenge id) that never starts in a correct order. */
export function shuffledOrder(ids: string[], seed: string, accepted: string[][]): string[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const random = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as string, out[i] as string];
  }
  const startsCorrect = () =>
    accepted.some((order) =>
      order.every((id, i) => out.filter((x) => order.includes(x))[i] === id),
    );
  for (let tries = 0; startsCorrect() && tries < out.length; tries++)
    out.push(out.shift() as string);
  return out;
}

export default {
  type: 'reorder',
  defaultXp: 10,
  schema,
  compile(c, ctx) {
    const all = [...c.items, ...c.distractors];
    const idOf = (text: string) => `i${all.indexOf(text)}`;
    const render = (text: string) =>
      c.lang ? ctx.highlight(text, c.lang) : ctx.inlineMarkdown(text);
    const orders = [c.items, ...c.alternatives].map((order) => order.map(idOf));
    const ids = shuffledOrder(all.map(idOf), c.id, orders);
    return {
      items: ids.map((id) => ({ id, html: render(all[Number(id.slice(1))] as string) })),
      orders,
      distractors: c.distractors.map(idOf),
      code: c.lang !== undefined,
    } satisfies ReorderSpec;
  },
  solution: (c, ctx) =>
    `<ol>${c.items.map((t) => `<li>${c.lang ? `<code>${escapeHtml(t)}</code>` : ctx.inlineMarkdown(t)}</li>`).join('')}</ol>` +
    (c.distractors.length
      ? `<p>Not needed: ${c.distractors.map((t) => (c.lang ? `<code>${escapeHtml(t)}</code>` : ctx.inlineMarkdown(t))).join(', ')}</p>`
      : ''),
} satisfies ChallengeBuild<Authored, ReorderSpec>;
