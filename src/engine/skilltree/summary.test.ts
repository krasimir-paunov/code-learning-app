import { describe, expect, it } from 'vitest';
import { summarizeModule } from './summary.ts';
import type { SkillManifest, SkillModule, SkillNode } from './types.ts';
import type { NodeStatus } from './unlock.ts';

const node = (id: string, tier: 'core' | 'extended', published: boolean): SkillNode => ({
  id,
  track: 't',
  module: 't.m',
  title: id,
  objective: '',
  minutes: 5,
  tier,
  boss: false,
  published,
  requires: [],
  recommends: [],
  related: [],
  position: { x: 0, y: 0 },
});

const module: SkillModule = {
  id: 't.m',
  track: 't',
  title: 'M',
  boss: false,
  lessons: ['t.a', 't.b', 't.c'],
  requires: [],
  dependsOn: [],
  recommendsModules: [],
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
};

const manifest: Pick<SkillManifest, 'nodes'> = {
  nodes: {
    't.a': node('t.a', 'core', true),
    't.b': node('t.b', 'extended', false),
    't.c': node('t.c', 'core', true),
  },
};

const status = (state: NodeStatus['state']): NodeStatus => ({
  state,
  recommendationPending: false,
  missing: [],
  pendingRecommendations: [],
  hasNew: false,
});

describe('summarizeModule', () => {
  it('counts lessons and applies the Core filter', () => {
    const statuses = {
      't.a': status('completed'),
      't.b': status('planned'),
      't.c': status('available'),
    };
    expect(summarizeModule(module, manifest, statuses)).toEqual({
      total: 3,
      published: 2,
      completed: 1,
      state: 'available',
    });
    expect(summarizeModule(module, manifest, statuses, 'core').total).toBe(2);
  });

  it('is completed when every published lesson is', () => {
    const statuses = {
      't.a': status('completed'),
      't.b': status('planned'),
      't.c': status('completed'),
    };
    expect(summarizeModule(module, manifest, statuses).state).toBe('completed');
  });

  it('is locked when nothing is open and planned when nothing is published', () => {
    const locked = { 't.a': status('locked'), 't.b': status('planned'), 't.c': status('locked') };
    expect(summarizeModule(module, manifest, locked).state).toBe('locked');
    const unpublished = {
      nodes: Object.fromEntries(
        Object.entries(manifest.nodes).map(([id, n]) => [id, { ...n, published: false }]),
      ),
    };
    expect(summarizeModule(module, unpublished, {}).state).toBe('planned');
  });
});
