/**
 * Loads and validates all content: curriculum.yaml, lessons (published = has lesson.yaml).
 * Shared by the Vite plugin, content:check, verify:snippets and route shells.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { CurriculumSchema, type Curriculum } from '../../src/engine/content/curriculum-schema.ts';
import { buildSkillGraph } from '../../src/engine/skilltree/graph.ts';
import type { PublishedInfo, SkillManifest } from '../../src/engine/skilltree/types.ts';
import { validateSkillGraph } from '../../src/engine/skilltree/validate.ts';
import { applyLayout } from './layout.ts';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const CONTENT_DIR = path.join(ROOT, 'content');
/** Test-only lessons (e2e builds): stubs that exercise engine paths real content can't yet. */
export const FIXTURE_CONTENT_DIR = path.join(ROOT, 'tests', 'fixtures', 'content');

export interface ContentIssue {
  file: string;
  message: string;
}

export interface LessonSource {
  id: string;
  /** Absolute path of lesson.yaml. */
  file: string;
  dir: string;
  data: unknown;
}

export interface ContentOptions {
  fixtures?: boolean;
}

export function relative(file: string): string {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

export function formatZodIssues(
  error: { issues: { path: PropertyKey[]; message: string }[] },
  prefix = '',
): string[] {
  return error.issues.map((issue) => {
    const where = [prefix, ...issue.path.map(String)].filter(Boolean).join('.');
    return `${where || '(root)'}: ${issue.message}`;
  });
}

export function readCurriculum(issues: ContentIssue[]): Curriculum | undefined {
  const file = path.join(CONTENT_DIR, 'curriculum.yaml');
  let raw: unknown;
  try {
    raw = parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    issues.push({ file: relative(file), message: `Invalid YAML: ${String(error)}` });
    return undefined;
  }
  const result = CurriculumSchema.safeParse(raw);
  if (!result.success) {
    for (const message of formatZodIssues(result.error))
      issues.push({ file: relative(file), message });
    return undefined;
  }
  return result.data;
}

/** content/lessons/<track>/<slug>/lesson.yaml; the folder must match the id "track.slug". */
export function discoverLessons(options: ContentOptions, issues: ContentIssue[]): LessonSource[] {
  const roots = [path.join(CONTENT_DIR, 'lessons')];
  if (options.fixtures) roots.push(path.join(FIXTURE_CONTENT_DIR, 'lessons'));
  const out: LessonSource[] = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const track of fs.readdirSync(root).sort()) {
      const trackDir = path.join(root, track);
      if (!fs.statSync(trackDir).isDirectory()) continue;
      for (const slug of fs.readdirSync(trackDir).sort()) {
        const file = path.join(trackDir, slug, 'lesson.yaml');
        if (!fs.existsSync(file)) continue;
        const id = `${track}.${slug}`;
        let data: unknown;
        try {
          data = parse(fs.readFileSync(file, 'utf8'));
        } catch (error) {
          issues.push({ file: relative(file), message: `Invalid YAML: ${String(error)}` });
          continue;
        }
        const declared = (data as { id?: unknown } | null)?.id;
        if (declared !== id) {
          issues.push({
            file: relative(file),
            message: `id must be "${id}" (got "${String(declared)}")`,
          });
          continue;
        }
        out.push({ id, file, dir: path.dirname(file), data });
      }
    }
  }
  return out;
}

/** Curriculum + published lessons → validated, laid-out manifest. */
export function buildManifest(
  curriculum: Curriculum,
  published: ReadonlyMap<string, PublishedInfo>,
  issues: ContentIssue[],
): SkillManifest {
  const manifest = buildSkillGraph(curriculum, published);
  for (const message of validateSkillGraph(curriculum, manifest)) {
    issues.push({ file: 'content/curriculum.yaml', message });
  }
  for (const id of published.keys()) {
    if (!manifest.nodes[id]) {
      issues.push({
        file: `content/lessons/${id.replace('.', '/')}`,
        message: `"${id}" is not in curriculum.yaml`,
      });
    }
  }
  return applyLayout(manifest);
}
