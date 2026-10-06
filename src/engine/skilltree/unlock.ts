import type { Progress } from '../progress/schema.ts';
import type { NodeId, SkillManifest, SkillNode } from './types.ts';

export type NodeState = 'planned' | 'locked' | 'available' | 'in-progress' | 'completed';

export interface NodeStatus {
  state: NodeState;
  /** Open, but a recommended lesson is not completed and its track's banner was not skipped. */
  recommendationPending: boolean;
  /** Effective hard prerequisites not completed yet (why a node is locked). */
  missing: NodeId[];
  /** Effective recommendations not completed yet. */
  pendingRecommendations: NodeId[];
  /** Completed, but the lesson gained challenges since (completion is never revoked). */
  hasNew: boolean;
}

export interface ProgressView {
  completed: ReadonlySet<NodeId>;
  started: ReadonlySet<NodeId>;
  passed: (lessonId: NodeId, challengeId: string) => boolean;
  freeRoam: boolean;
  skippedRecommendations: readonly string[];
}

export function progressView(progress: Progress): ProgressView {
  const completed = new Set<NodeId>();
  for (const [id, lesson] of Object.entries(progress.lessons)) {
    if (lesson.completedAt) completed.add(id);
  }
  return {
    completed,
    started: new Set(Object.keys(progress.lessons)),
    passed: (lessonId, challengeId) =>
      progress.lessons[lessonId]?.challenges[challengeId]?.passedAt !== undefined,
    freeRoam: progress.settings.freeRoam,
    skippedRecommendations: progress.skippedRecommendations,
  };
}

export interface ResolvedGraph {
  /** Hard prerequisites with unpublished lessons replaced by their own requirements. */
  requires: ReadonlyMap<NodeId, NodeId[]>;
  /** Recommendations pointing at published lessons only. */
  recommends: ReadonlyMap<NodeId, NodeId[]>;
}

/**
 * A requirement on an unpublished lesson is replaced by that lesson's own requirements
 * (transitively), so gaps in authored content never lock the map.
 */
export function resolveGraph(manifest: Pick<SkillManifest, 'nodes'>): ResolvedGraph {
  const { nodes } = manifest;
  const memo = new Map<NodeId, NodeId[]>();

  function effective(id: NodeId, visiting: Set<NodeId>): NodeId[] {
    const cached = memo.get(id);
    if (cached) return cached;
    if (visiting.has(id)) return []; // cycles are rejected by content:check; never loop here
    visiting.add(id);
    const out = new Set<NodeId>();
    for (const req of nodes[id]?.requires ?? []) {
      const target = nodes[req];
      if (!target) continue;
      if (target.published) out.add(req);
      else for (const inherited of effective(req, visiting)) out.add(inherited);
    }
    visiting.delete(id);
    const result = [...out];
    memo.set(id, result);
    return result;
  }

  const requires = new Map<NodeId, NodeId[]>();
  const recommends = new Map<NodeId, NodeId[]>();
  for (const id of Object.keys(nodes)) {
    requires.set(id, effective(id, new Set()));
    recommends.set(
      id,
      (nodes[id]?.recommends ?? []).filter((r) => nodes[r]?.published),
    );
  }
  return { requires, recommends };
}

export function nodeStatus(node: SkillNode, graph: ResolvedGraph, view: ProgressView): NodeStatus {
  const missing = (graph.requires.get(node.id) ?? []).filter((id) => !view.completed.has(id));
  const pendingRecommendations = (graph.recommends.get(node.id) ?? []).filter(
    (id) => !view.completed.has(id),
  );
  const completed = view.completed.has(node.id);
  const hasNew =
    completed && (node.challengeIds ?? []).some((challenge) => !view.passed(node.id, challenge));

  let state: NodeState;
  if (!node.published) state = 'planned';
  else if (completed) state = 'completed';
  else if (missing.length > 0 && !view.freeRoam) state = 'locked';
  else if (view.started.has(node.id)) state = 'in-progress';
  else state = 'available';

  const open = state === 'available' || state === 'in-progress';
  return {
    state,
    recommendationPending:
      open &&
      !view.freeRoam &&
      pendingRecommendations.length > 0 &&
      !view.skippedRecommendations.includes(node.track),
    missing,
    pendingRecommendations,
    hasNew,
  };
}

export function deriveStatuses(
  manifest: Pick<SkillManifest, 'nodes'>,
  graph: ResolvedGraph,
  view: ProgressView,
): Record<NodeId, NodeStatus> {
  const out: Record<NodeId, NodeStatus> = {};
  for (const node of Object.values(manifest.nodes)) out[node.id] = nodeStatus(node, graph, view);
  return out;
}

/** The learner's frontier: the first open lesson in teaching order (the map opens there). */
export function frontier(
  manifest: Pick<SkillManifest, 'order'>,
  statuses: Record<NodeId, NodeStatus>,
): NodeId | undefined {
  const open = (id: NodeId) =>
    statuses[id]?.state === 'in-progress' || statuses[id]?.state === 'available';
  return manifest.order.find(open);
}

/** Where "Next" goes after a lesson: the next open lesson in teaching order, if any. */
export function nextLesson(
  manifest: Pick<SkillManifest, 'order'>,
  statuses: Record<NodeId, NodeStatus>,
  current: NodeId,
): NodeId | undefined {
  const start = manifest.order.indexOf(current);
  const open = (id: NodeId) =>
    statuses[id]?.state === 'available' || statuses[id]?.state === 'in-progress';
  return manifest.order.slice(start + 1).find(open) ?? manifest.order.slice(0, start).find(open);
}
