import { z } from 'zod';
import type { PublishedInfo, SkillManifest } from '../../src/engine/skilltree/types.ts';
import {
  buildManifest,
  discoverLessons,
  readCurriculum,
  relative,
  type ContentIssue,
  type ContentOptions,
} from './load.ts';

export interface ContentBundle {
  manifest: SkillManifest;
  issues: ContentIssue[];
}

/** What the map needs from a lesson file, without compiling it. */
const LessonHeaderSchema = z.object({
  version: z.number().int().min(1),
  summary: z.string().min(1),
  challenges: z.array(z.object({ id: z.string().min(1) })).min(1),
});

export async function loadContent(options: ContentOptions = {}): Promise<ContentBundle> {
  const issues: ContentIssue[] = [];
  const curriculum = readCurriculum(issues);
  const published = new Map<string, PublishedInfo>();
  for (const lesson of discoverLessons(options, issues)) {
    const header = LessonHeaderSchema.safeParse(lesson.data);
    if (!header.success) {
      issues.push({
        file: relative(lesson.file),
        message: header.error.issues[0]?.message ?? 'invalid',
      });
      continue;
    }
    published.set(lesson.id, {
      version: header.data.version,
      summary: header.data.summary,
      challengeIds: header.data.challenges.map((c) => c.id),
    });
  }
  if (!curriculum) {
    return {
      manifest: {
        tracks: [],
        modules: {},
        nodes: {},
        order: [],
        overview: { width: 0, height: 0, lanes: {} },
      },
      issues,
    };
  }
  return { manifest: buildManifest(curriculum, published, issues), issues };
}

export function formatIssues(issues: ContentIssue[]): string {
  return issues.map((issue) => `  ${issue.file}: ${issue.message}`).join('\n');
}
