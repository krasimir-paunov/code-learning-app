import manifest from 'virtual:content/manifest';
import { useProgress } from '../progress/store.ts';
import {
  deriveStatuses,
  progressView,
  resolveGraph,
  type NodeStatus,
} from '../skilltree/unlock.ts';

/** The build-time skill graph (validated, laid out). Loaded by routes that need it. */
export { manifest };

/** Requirements with unpublished lessons resolved away; depends only on the build. */
export const resolvedGraph = resolveGraph(manifest);

export function trackOf(id: string) {
  return manifest.tracks.find((track) => track.id === id);
}

/** Derived node states for the current progress (never stored). */
export function useNodeStatuses(): Record<string, NodeStatus> {
  const progress = useProgress((s) => s.progress);
  return deriveStatuses(manifest, resolvedGraph, progressView(progress));
}
