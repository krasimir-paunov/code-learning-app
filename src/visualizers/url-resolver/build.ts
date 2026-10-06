import { z } from 'zod';
import type { VisualizerBuild } from '../../engine/challenges/build-contract.ts';
import { traceSteps } from './model.ts';

const FilePath = z.string().regex(/^\/[\w./-]+$/, 'file paths start with / ');

export const UrlResolverPropsSchema = z.strictObject({
  origin: z.string().url().default('https://site.example'),
  files: z.array(FilePath).min(2).max(16),
  /** The page you start on (one of `files`). */
  page: FilePath,
  /** Example hrefs offered as quick picks. */
  hrefs: z.array(z.string().min(1)).min(1).max(8),
});

export type UrlResolverProps = z.infer<typeof UrlResolverPropsSchema>;

const TracePropsSchema = z.strictObject({
  origin: z.string().url().default('https://site.example'),
  files: z.array(FilePath).min(2).max(16),
  page: FilePath,
  href: z.string().min(1),
});

export type UrlTraceProps = z.infer<typeof TracePropsSchema>;

export default {
  id: 'url-resolver',
  props: UrlResolverPropsSchema,
  trace: {
    props: TracePropsSchema,
    // A step is the folder (or, last, the file) the browser moves to next.
    steps: (p) => traceSteps(p.href, p.origin + p.page),
  },
} satisfies VisualizerBuild<UrlResolverProps, UrlTraceProps>;
