/**
 * Deterministic skill-tree layout, computed once at build time (never in the browser).
 * - Module zoom: dagre (top-to-bottom) over the lessons and edges inside the module.
 * - Overview: tracks are vertical lanes; a module's row is its dependency depth, so every
 *   prerequisite module sits above the modules that need it.
 */
import { graphlib, layout } from '@dagrejs/dagre';
import {
  LESSON_NODE,
  MODULE_CARD,
  MODULE_VIEW,
  OVERVIEW,
} from '../../src/engine/skilltree/layout-constants.ts';
import type { SkillManifest } from '../../src/engine/skilltree/types.ts';

function layoutModules(manifest: SkillManifest) {
  for (const module of Object.values(manifest.modules)) {
    const g = new graphlib.Graph();
    g.setGraph({
      rankdir: 'TB',
      nodesep: MODULE_VIEW.nodeSep,
      ranksep: MODULE_VIEW.rankSep,
      marginx: MODULE_VIEW.padding,
      marginy: MODULE_VIEW.padding,
    });
    g.setDefaultEdgeLabel(() => ({}));
    for (const id of module.lessons) {
      const node = manifest.nodes[id];
      if (node) g.setNode(id, { ...LESSON_NODE[node.tier] });
    }
    for (const id of module.lessons) {
      for (const req of manifest.nodes[id]?.requires ?? []) {
        if (module.lessons.includes(req)) g.setEdge(req, id);
      }
    }
    layout(g);
    for (const id of module.lessons) {
      const placed = g.node(id);
      const node = manifest.nodes[id];
      if (node && placed) node.position = { x: Math.round(placed.x), y: Math.round(placed.y) };
    }
    const size = g.graph();
    module.size = { width: Math.ceil(size.width ?? 0), height: Math.ceil(size.height ?? 0) };
  }
}

function layoutOverview(manifest: SkillManifest) {
  const rank = new Map<string, number>();
  const rankOf = (id: string): number => {
    const known = rank.get(id);
    if (known !== undefined) return known;
    rank.set(id, 0); // provisional; the graph is acyclic (validated)
    const value = Math.max(-1, ...(manifest.modules[id]?.dependsOn ?? []).map(rankOf)) + 1;
    rank.set(id, value);
    return value;
  };

  let x = OVERVIEW.padding;
  let maxRow = 0;
  const lanes: Record<string, { x: number; width: number }> = {};
  for (const track of manifest.tracks) {
    // Modules sharing a row inside one lane get side-by-side sub-columns.
    const used = new Map<number, number>();
    let subColumns = 1;
    for (const id of track.modules) {
      const row = rankOf(id);
      const column = used.get(row) ?? 0;
      used.set(row, column + 1);
      subColumns = Math.max(subColumns, column + 1);
      maxRow = Math.max(maxRow, row);
      const module = manifest.modules[id];
      if (module) {
        module.position = {
          x: x + column * (MODULE_CARD.width + OVERVIEW.laneGap) + MODULE_CARD.width / 2,
          y: OVERVIEW.padding + OVERVIEW.header + row * OVERVIEW.rowHeight + MODULE_CARD.height / 2,
        };
      }
    }
    const width = subColumns * MODULE_CARD.width + (subColumns - 1) * OVERVIEW.laneGap;
    lanes[track.id] = { x, width };
    x += width + OVERVIEW.laneGap * 2;
  }
  manifest.overview = {
    width: x - OVERVIEW.laneGap * 2 + OVERVIEW.padding,
    height: OVERVIEW.padding * 2 + OVERVIEW.header + (maxRow + 1) * OVERVIEW.rowHeight,
    lanes,
  };
}

export function applyLayout(manifest: SkillManifest): SkillManifest {
  layoutModules(manifest);
  layoutOverview(manifest);
  return manifest;
}
