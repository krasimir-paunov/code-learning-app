/** Shared by the build-time layout and the map renderer, so both agree on geometry. */
export const LESSON_NODE = {
  core: { width: 220, height: 80 },
  extended: { width: 180, height: 72 },
};

export const MODULE_CARD = { width: 168, height: 84 };

/** Overview: one vertical lane per track, one row per dependency rank. */
export const OVERVIEW = {
  laneGap: 16,
  rowHeight: 124,
  padding: 32,
  /** Space above the first row for the lane headers. */
  header: 56,
};

export const MODULE_VIEW = { padding: 32, nodeSep: 40, rankSep: 56 };
