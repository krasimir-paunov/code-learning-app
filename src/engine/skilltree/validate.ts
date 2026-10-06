import type { Curriculum } from '../content/curriculum-schema.ts';
import type { SkillManifest } from './types.ts';

/**
 * Graph rules (ARCHITECTURE §5): unique ids, every reference resolves, no cycles, and
 * Core never hard-requires Extended (so shipping Core only can never strand a learner).
 */
export function validateSkillGraph(curriculum: Curriculum, graph: SkillManifest): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const track of curriculum.tracks) {
    for (const module of track.modules) {
      if (seen.has(module.id)) issues.push(`Duplicate id "${module.id}"`);
      seen.add(module.id);
      if (!module.id.startsWith(`${track.id}.`)) {
        issues.push(`Module "${module.id}" must be namespaced "${track.id}."`);
      }
      for (const lesson of module.lessons) {
        if (seen.has(lesson.id)) issues.push(`Duplicate id "${lesson.id}"`);
        seen.add(lesson.id);
        if (!lesson.id.startsWith(`${track.id}.`)) {
          issues.push(`Lesson "${lesson.id}" must be namespaced "${track.id}."`);
        }
        if (module.boss && lesson.tier !== 'core') {
          issues.push(`Boss lesson "${lesson.id}" must be Core`);
        }
      }
    }
  }

  const { nodes, modules } = graph;
  const exists = (id: string) => id in nodes;
  for (const module of Object.values(modules)) {
    for (const id of module.requires) {
      if (!exists(id)) issues.push(`Module "${module.id}" requires unknown lesson "${id}"`);
      else if (nodes[id]?.tier === 'extended') {
        issues.push(`Module "${module.id}" entry requires Extended lesson "${id}"`);
      }
    }
  }
  for (const node of Object.values(nodes)) {
    for (const [kind, list] of [
      ['requires', node.requires],
      ['recommends', node.recommends],
      ['related', node.related],
    ] as const) {
      for (const id of list) {
        if (!exists(id)) issues.push(`"${node.id}" ${kind} unknown lesson "${id}"`);
        if (id === node.id) issues.push(`"${node.id}" ${kind} itself`);
      }
    }
    if (node.tier === 'core') {
      for (const id of node.requires) {
        if (nodes[id]?.tier === 'extended') {
          issues.push(`Core lesson "${node.id}" requires Extended lesson "${id}"`);
        }
      }
    }
  }

  // Cycle detection over hard edges (iterative DFS, three colors).
  const color = new Map<string, 'grey' | 'black'>();
  for (const start of Object.keys(nodes)) {
    if (color.has(start)) continue;
    const stack: [string, number][] = [[start, 0]];
    color.set(start, 'grey');
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (!top) break;
      const [id, index] = top;
      const requires = nodes[id]?.requires ?? [];
      if (index >= requires.length) {
        color.set(id, 'black');
        stack.pop();
        continue;
      }
      top[1] = index + 1;
      const next = requires[index];
      if (next === undefined || !exists(next)) continue;
      const state = color.get(next);
      if (state === 'grey') {
        const path = stack.map(([n]) => n);
        issues.push(`Cycle: ${[...path.slice(path.indexOf(next)), next].join(' → ')}`);
      } else if (!state) {
        color.set(next, 'grey');
        stack.push([next, 0]);
      }
    }
  }
  return issues;
}
