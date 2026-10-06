import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { CurriculumSchema, type Curriculum } from '../content/curriculum-schema.ts';
import { buildSkillGraph } from './graph.ts';
import type { PublishedInfo } from './types.ts';
import { deriveStatuses, frontier, nextLesson, resolveGraph, type ProgressView } from './unlock.ts';
import { validateSkillGraph } from './validate.ts';

/** Two tracks; C# recommends a JS lesson; one Extended lesson in the middle of a module. */
const fixture: Curriculum = CurriculumSchema.parse({
  tracks: [
    {
      id: 'js',
      title: 'JavaScript',
      short: 'JS',
      color: 'track-js',
      modules: [
        {
          id: 'js.values',
          title: 'Values',
          lessons: [
            { id: 'js.a', title: 'A', minutes: 5, objective: 'o' },
            { id: 'js.b', title: 'B', minutes: 5, objective: 'o', tier: 'extended' },
            { id: 'js.c', title: 'C', minutes: 5, objective: 'o' },
          ],
        },
        {
          id: 'js.data',
          title: 'Data',
          lessons: [
            { id: 'js.d', title: 'D', minutes: 5, objective: 'o' },
            { id: 'js.e', title: 'E', minutes: 5, objective: 'o', tier: 'extended' },
          ],
        },
      ],
    },
    {
      id: 'cs',
      title: 'C#',
      short: 'C#',
      color: 'track-cs',
      modules: [
        {
          id: 'cs.toolchain',
          title: 'Toolchain',
          recommends: ['js.d'],
          lessons: [
            { id: 'cs.x', title: 'X', minutes: 5, objective: 'o' },
            { id: 'cs.y', title: 'Y', minutes: 5, objective: 'o', requires: ['js.c'] },
          ],
        },
      ],
    },
  ],
});

const pub = (...ids: string[]) =>
  new Map<string, PublishedInfo>(
    ids.map((id) => [id, { version: 1, summary: '', challengeIds: ['q'] }]),
  );

function view(partial: Partial<ProgressView> = {}): ProgressView {
  return {
    completed: new Set(),
    started: new Set(),
    passed: () => true,
    freeRoam: false,
    skippedRecommendations: [],
    ...partial,
  };
}

describe('buildSkillGraph (implicit chain)', () => {
  const graph = buildSkillGraph(fixture);

  it('chains Core to the previous Core lesson and skips Extended ones', () => {
    expect(graph.nodes['js.c']?.requires).toEqual(['js.a']);
  });

  it('chains Extended to the previous lesson of either tier', () => {
    expect(graph.nodes['js.b']?.requires).toEqual(['js.a']);
    expect(graph.nodes['js.e']?.requires).toEqual(['js.d']);
  });

  it("defaults a module's entry to the last Core lesson of the previous module", () => {
    expect(graph.modules['js.data']?.requires).toEqual(['js.c']);
    expect(graph.nodes['js.d']?.requires).toEqual(['js.c']);
  });

  it('adds explicit requires and puts module recommendations on the first Core lesson', () => {
    expect(graph.nodes['cs.y']?.requires).toEqual(['cs.x', 'js.c']);
    expect(graph.nodes['cs.x']?.recommends).toEqual(['js.d']);
    expect(graph.nodes['cs.y']?.recommends).toEqual([]);
  });

  it('keeps teaching order', () => {
    expect(graph.order).toEqual(['js.a', 'js.b', 'js.c', 'js.d', 'js.e', 'cs.x', 'cs.y']);
  });
});

describe('validateSkillGraph', () => {
  it('accepts the fixture', () => {
    expect(validateSkillGraph(fixture, buildSkillGraph(fixture))).toEqual([]);
  });

  it('rejects Core lessons that hard-require Extended ones', () => {
    const bad = structuredClone(fixture);
    bad.tracks[1]?.modules[0]?.lessons[1]?.requires.push('js.b');
    expect(validateSkillGraph(bad, buildSkillGraph(bad))).toContain(
      'Core lesson "cs.y" requires Extended lesson "js.b"',
    );
  });

  it('rejects unknown references, duplicates and cycles', () => {
    const bad = structuredClone(fixture);
    const jsA = bad.tracks[0]?.modules[0]?.lessons[0];
    if (!jsA) throw new Error('fixture changed');
    jsA.requires.push('js.c'); // js.c → js.a → js.c
    jsA.related.push('js.nope');
    bad.tracks[1]?.modules[0]?.lessons.push({ ...structuredClone(jsA), id: 'cs.x' });
    const issues = validateSkillGraph(bad, buildSkillGraph(bad));
    expect(issues).toContain('"js.a" related unknown lesson "js.nope"');
    expect(issues).toContain('Duplicate id "cs.x"');
    expect(issues.some((i) => i.startsWith('Cycle: '))).toBe(true);
  });
});

describe('unlock rules', () => {
  it('resolves unpublished prerequisites to their own requirements', () => {
    // Only js.d and cs.y published: js.d's chain (js.c → js.a) is all unpublished → no requirement.
    const graph = buildSkillGraph(fixture, pub('js.d', 'cs.y'));
    const resolved = resolveGraph(graph);
    expect(resolved.requires.get('js.d')).toEqual([]);
    expect(resolved.requires.get('cs.y')).toEqual([]);
    // With js.a published, js.d needs js.a (js.c is unpublished and inherits js.a).
    const graph2 = buildSkillGraph(fixture, pub('js.a', 'js.d'));
    expect(resolveGraph(graph2).requires.get('js.d')).toEqual(['js.a']);
  });

  it('derives planned / locked / available / in-progress / completed', () => {
    const graph = buildSkillGraph(fixture, pub('js.a', 'js.c', 'js.d'));
    const resolved = resolveGraph(graph);
    let statuses = deriveStatuses(graph, resolved, view());
    expect(statuses['js.b']?.state).toBe('planned');
    expect(statuses['js.a']?.state).toBe('available');
    expect(statuses['js.c']?.state).toBe('locked');
    expect(statuses['js.c']?.missing).toEqual(['js.a']);
    expect(frontier(graph, statuses)).toBe('js.a');

    statuses = deriveStatuses(
      graph,
      resolved,
      view({ completed: new Set(['js.a']), started: new Set(['js.a', 'js.c']) }),
    );
    expect(statuses['js.a']?.state).toBe('completed');
    expect(statuses['js.c']?.state).toBe('in-progress');
    expect(statuses['js.d']?.state).toBe('locked');
    expect(frontier(graph, statuses)).toBe('js.c');
  });

  it('free roam opens every published lesson but never planned ones', () => {
    const graph = buildSkillGraph(fixture, pub('js.a', 'js.c'));
    const statuses = deriveStatuses(graph, resolveGraph(graph), view({ freeRoam: true }));
    expect(statuses['js.c']?.state).toBe('available');
    expect(statuses['js.b']?.state).toBe('planned');
  });

  it('flags pending recommendations until completed or skipped for the track', () => {
    const graph = buildSkillGraph(fixture, pub('js.d', 'cs.x'));
    const resolved = resolveGraph(graph);
    expect(deriveStatuses(graph, resolved, view())['cs.x']).toMatchObject({
      state: 'available',
      recommendationPending: true,
      pendingRecommendations: ['js.d'],
    });
    const skipped = view({ skippedRecommendations: ['cs'] });
    expect(deriveStatuses(graph, resolved, skipped)['cs.x']?.recommendationPending).toBe(false);
    const done = view({ completed: new Set(['js.d']) });
    expect(deriveStatuses(graph, resolved, done)['cs.x']?.recommendationPending).toBe(false);
    const roam = view({ freeRoam: true });
    expect(deriveStatuses(graph, resolved, roam)['cs.x']?.recommendationPending).toBe(false);
  });

  it('drops recommendations that point at unpublished lessons', () => {
    const graph = buildSkillGraph(fixture, pub('cs.x'));
    expect(deriveStatuses(graph, resolveGraph(graph), view())['cs.x']?.recommendationPending).toBe(
      false,
    );
  });

  it('marks a completed lesson "new" when it gained a challenge', () => {
    const graph = buildSkillGraph(fixture, pub('js.a'));
    const statuses = deriveStatuses(
      graph,
      resolveGraph(graph),
      view({ completed: new Set(['js.a']), passed: () => false }),
    );
    expect(statuses['js.a']).toMatchObject({ state: 'completed', hasNew: true });
  });
});

describe('content/curriculum.yaml', () => {
  const file = path.join(import.meta.dirname, '../../../content/curriculum.yaml');
  const curriculum = CurriculumSchema.parse(parse(fs.readFileSync(file, 'utf8')));
  const graph = buildSkillGraph(curriculum);

  it('is a valid graph with all 272 planned lessons', () => {
    expect(validateSkillGraph(curriculum, graph)).toEqual([]);
    expect(graph.order).toHaveLength(272);
    const core = Object.values(graph.nodes).filter((n) => n.tier === 'core');
    expect(core).toHaveLength(207);
  });

  it('never locks a Core lesson behind unbuilt content', () => {
    const resolved = resolveGraph(
      buildSkillGraph(curriculum, pub('css.box-model', 'algo.binary-search')),
    );
    expect(resolved.requires.get('css.box-model')).toEqual([]);
    expect(resolved.requires.get('algo.binary-search')).toEqual([]);
  });
});

describe('module dependencies', () => {
  it('collects entry and cross-module lesson edges, and recommended modules', () => {
    const graph = buildSkillGraph(fixture);
    expect(graph.modules['js.data']?.dependsOn).toEqual(['js.values']);
    expect(graph.modules['cs.toolchain']?.dependsOn).toEqual(['js.values']);
    expect(graph.modules['cs.toolchain']?.recommendsModules).toEqual(['js.data']);
  });
});

describe('nextLesson', () => {
  it('picks the next open lesson in teaching order, wrapping around', () => {
    const graph = buildSkillGraph(fixture, pub('js.a', 'js.c', 'cs.x'));
    const statuses = deriveStatuses(
      graph,
      resolveGraph(graph),
      view({ completed: new Set(['js.a']) }),
    );
    expect(nextLesson(graph, statuses, 'js.a')).toBe('js.c');
    expect(nextLesson(graph, statuses, 'cs.x')).toBe('js.c');
  });
});
