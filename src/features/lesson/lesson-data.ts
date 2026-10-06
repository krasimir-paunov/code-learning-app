import { lessonLoaders } from 'virtual:content/lessons';
import type { CompiledLesson } from '../../engine/content/lesson-types.ts';

const cache = new Map<string, CompiledLesson>();

/** Loads a published lesson's content chunk once; later calls reuse it. */
export async function loadLesson(id: string): Promise<CompiledLesson | undefined> {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = lessonLoaders[id];
  if (!loader) return undefined;
  const lesson = (await loader()).default;
  cache.set(id, lesson);
  return lesson;
}

/** The lesson if it is already loaded (so the page can render it without a loading state). */
export function cachedLesson(id: string): CompiledLesson | undefined {
  return cache.get(id);
}
