import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';

const Link = z.strictObject({
  href: z.string(),
  text: z.string(),
  newTab: z.boolean().default(false),
  download: z.boolean().default(false),
});

export const LinkLabPropsSchema = z.strictObject({
  /** The address of the page the link lives on (relative links resolve against it). */
  pageUrl: z.string().url(),
  /** Sections of the demo page; fragment links can scroll to them. */
  sections: z
    .array(z.strictObject({ id: z.string().regex(/^[a-z][a-z0-9-]*$/), title: z.string().min(1) }))
    .min(1)
    .max(5),
  presets: z
    .array(z.strictObject({ label: z.string().min(1), link: Link }))
    .min(1)
    .max(6),
});

export type LinkLabProps = z.infer<typeof LinkLabPropsSchema>;

export default {
  id: 'link-lab',
  props: LinkLabPropsSchema,
} satisfies VisualizerBuild<LinkLabProps>;
