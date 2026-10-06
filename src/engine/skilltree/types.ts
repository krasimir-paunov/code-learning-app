import type { Tier } from '../content/curriculum-schema.ts';

export type NodeId = string;

/** Facts about a published lesson that the map needs without loading the lesson. */
export interface PublishedInfo {
  version: number;
  summary: string;
  challengeIds: string[];
}

export interface SkillNode {
  id: NodeId;
  track: string;
  module: string;
  title: string;
  objective: string;
  minutes: number;
  tier: Tier;
  boss: boolean;
  /** false = planned ("coming soon"). */
  published: boolean;
  /** Direct hard prerequisites: implicit chain + explicit extras (unpublished not yet resolved). */
  requires: NodeId[];
  recommends: NodeId[];
  related: NodeId[];
  /** Module-local layout (center of the node), computed at build time. */
  position: { x: number; y: number };
  version?: number;
  summary?: string;
  challengeIds?: string[];
}

export interface SkillModule {
  id: string;
  track: string;
  title: string;
  boss: boolean;
  lessons: NodeId[];
  /** Entry prerequisites (lesson ids). */
  requires: NodeId[];
  /** Modules this one depends on: entry requirements plus lesson edges that cross modules. */
  dependsOn: string[];
  /** Modules with lessons this one recommends (soft, dotted on the overview). */
  recommendsModules: string[];
  /** Overview layout (center of the module card). */
  position: { x: number; y: number };
  /** Size of the module-zoom canvas. */
  size: { width: number; height: number };
}

export interface SkillTrack {
  id: string;
  title: string;
  short: string;
  /** Design token name, e.g. "track-css". */
  color: string;
  modules: string[];
}

export interface SkillManifest {
  tracks: SkillTrack[];
  modules: Record<string, SkillModule>;
  nodes: Record<NodeId, SkillNode>;
  /** Every lesson in curriculum (teaching) order. */
  order: NodeId[];
  /** Overview canvas size and one vertical lane per track. */
  overview: { width: number; height: number; lanes: Record<string, { x: number; width: number }> };
}
