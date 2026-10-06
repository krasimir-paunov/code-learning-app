import type { PublishedInfo, SkillManifest } from '../../src/engine/skilltree/types.ts';
import { compileLesson, type LessonBuild } from './compile-lesson.ts';
import { compileSheets, type SheetBuild } from './compile-sheets.ts';
import { createCodeHighlighter } from './highlight.ts';
import {
  buildManifest,
  discoverLessons,
  readCurriculum,
  relative,
  type ContentIssue,
  type ContentOptions,
} from './load.ts';
import { createMarkdown } from './markdown.ts';
import { loadPlugins } from './plugins.ts';

export interface ContentBundle {
  manifest: SkillManifest;
  lessons: LessonBuild[];
  sheets: SheetBuild[];
  issues: ContentIssue[];
}

const EMPTY_MANIFEST: SkillManifest = {
  tracks: [],
  modules: {},
  nodes: {},
  order: [],
  overview: { width: 0, height: 0, lanes: {} },
};

export async function loadContent(options: ContentOptions = {}): Promise<ContentBundle> {
  const issues: ContentIssue[] = [];
  const curriculum = readCurriculum(issues);
  const plugins = await loadPlugins();
  const highlighter = await createCodeHighlighter();
  const markdown = createMarkdown(highlighter);

  const lessons: LessonBuild[] = [];
  for (const source of discoverLessons(options, issues)) {
    const build = compileLesson(source, { plugins, highlighter, markdown }, issues);
    if (build) lessons.push(build);
  }
  if (!curriculum) return { manifest: EMPTY_MANIFEST, lessons, sheets: [], issues };

  const published = new Map<string, PublishedInfo>(
    lessons.map((l) => [
      l.id,
      {
        version: l.compiled.version,
        summary: l.compiled.summary,
        challengeIds: l.compiled.challenges.map((c) => c.id),
      },
    ]),
  );
  const manifest = buildManifest(curriculum, published, issues);

  // A lesson file and its curriculum entry must agree (one truth for the map and the page).
  for (const lesson of lessons) {
    const node = manifest.nodes[lesson.id];
    const file = relative(lesson.file);
    if (!node) continue;
    if (node.title !== lesson.compiled.title) {
      issues.push({
        file,
        message: `title "${lesson.compiled.title}" differs from curriculum.yaml "${node.title}"`,
      });
    }
    if (node.minutes !== lesson.compiled.minutes) {
      issues.push({
        file,
        message: `minutes ${lesson.compiled.minutes} differ from curriculum.yaml ${node.minutes}`,
      });
    }
    for (const id of lesson.compiled.related) {
      if (!manifest.nodes[id]) issues.push({ file, message: `related: unknown lesson "${id}"` });
    }
  }
  const sheets = compileSheets(manifest, { highlighter, markdown }, issues);
  return { manifest, lessons, sheets, issues };
}

export function formatIssues(issues: ContentIssue[]): string {
  return issues.map((issue) => `  ${issue.file}: ${issue.message}`).join('\n');
}
