import type { NodeState, NodeStatus } from './unlock.ts';
import type { SkillManifest, SkillModule, SkillNode } from './types.ts';

export type TierFilter = 'all' | 'core';

export function visibleInFilter(node: SkillNode, filter: TierFilter): boolean {
  return filter === 'all' || node.tier === 'core';
}

/** Text that always accompanies state colors and icons (color never carries meaning alone). */
export const STATE_LABELS: Record<NodeState, string> = {
  planned: 'Coming soon',
  locked: 'Locked',
  available: 'Available',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export type ModuleState = 'planned' | 'locked' | 'available' | 'completed';

export interface ModuleSummary {
  /** Lessons in the module (after the tier filter). */
  total: number;
  published: number;
  completed: number;
  state: ModuleState;
}

export function summarizeModule(
  module: SkillModule,
  manifest: Pick<SkillManifest, 'nodes'>,
  statuses: Record<string, NodeStatus>,
  filter: TierFilter = 'all',
): ModuleSummary {
  let total = 0;
  let published = 0;
  let completed = 0;
  let open = 0;
  for (const id of module.lessons) {
    const node = manifest.nodes[id];
    if (!node || !visibleInFilter(node, filter)) continue;
    total++;
    const state = statuses[id]?.state;
    if (node.published) published++;
    if (state === 'completed') completed++;
    if (state === 'available' || state === 'in-progress') open++;
  }
  let state: ModuleState;
  if (published === 0) state = 'planned';
  else if (completed === published) state = 'completed';
  else if (open > 0) state = 'available';
  else state = 'locked';
  return { total, published, completed, state };
}
