import type { Curriculum } from '../content/curriculum-schema.ts';
import type {
  NodeId,
  PublishedInfo,
  SkillManifest,
  SkillModule,
  SkillNode,
  SkillTrack,
} from './types.ts';

/**
 * Expands curriculum.yaml into the skill graph (ARCHITECTURE §5):
 * - a Core lesson requires the previous Core lesson of its module;
 * - an Extended lesson requires the previous lesson of either tier;
 * - a module's first lesson requires the module entry (default: last Core lesson of the
 *   previous module in the same track);
 * - explicit `requires` add edges; module `recommends` apply to its first Core lesson.
 * Positions are zero here; the build fills them in (layout.ts).
 */
export function buildSkillGraph(
  curriculum: Curriculum,
  published: ReadonlyMap<NodeId, PublishedInfo> = new Map(),
): SkillManifest {
  const tracks: SkillTrack[] = [];
  const modules: Record<string, SkillModule> = {};
  const nodes: Record<NodeId, SkillNode> = {};
  const order: NodeId[] = [];

  for (const track of curriculum.tracks) {
    let previousLastCore: NodeId | undefined;
    tracks.push({
      id: track.id,
      title: track.title,
      short: track.short,
      color: track.color,
      modules: track.modules.map((m) => m.id),
    });

    for (const module of track.modules) {
      const entry = module.requires ?? (previousLastCore ? [previousLastCore] : []);
      modules[module.id] = {
        id: module.id,
        track: track.id,
        title: module.title,
        boss: module.boss,
        lessons: module.lessons.map((l) => l.id),
        requires: entry,
        dependsOn: [],
        recommendsModules: [],
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
      };

      let previousCore: NodeId | undefined;
      let previousAny: NodeId | undefined;
      let firstCoreSeen = false;
      for (const lesson of module.lessons) {
        const chainPrev = lesson.tier === 'core' ? previousCore : previousAny;
        const implicit = chainPrev ? [chainPrev] : entry;
        const isFirstCore = lesson.tier === 'core' && !firstCoreSeen;
        const info = published.get(lesson.id);
        nodes[lesson.id] = {
          id: lesson.id,
          track: track.id,
          module: module.id,
          title: lesson.title,
          objective: lesson.objective,
          minutes: lesson.minutes,
          tier: lesson.tier,
          boss: module.boss,
          published: info !== undefined,
          requires: [...new Set([...implicit, ...lesson.requires])],
          recommends: [
            ...new Set([...(isFirstCore ? module.recommends : []), ...lesson.recommends]),
          ],
          related: lesson.related,
          position: { x: 0, y: 0 },
          ...(info && {
            version: info.version,
            summary: info.summary,
            challengeIds: info.challengeIds,
          }),
        };
        order.push(lesson.id);
        previousAny = lesson.id;
        if (lesson.tier === 'core') {
          previousCore = lesson.id;
          firstCoreSeen = true;
        }
      }
      previousLastCore = previousCore ?? previousLastCore;
    }
  }

  for (const module of Object.values(modules)) {
    const owners = (ids: readonly NodeId[]) =>
      [...new Set(ids.map((id) => nodes[id]?.module))].filter(
        (owner): owner is string => owner !== undefined && owner !== module.id,
      );
    const lessons = module.lessons.map((id) => nodes[id]);
    module.dependsOn = owners([...module.requires, ...lessons.flatMap((n) => n?.requires ?? [])]);
    module.recommendsModules = owners(lessons.flatMap((n) => n?.recommends ?? []));
  }

  return { tracks, modules, nodes, order, overview: { width: 0, height: 0, lanes: {} } };
}
