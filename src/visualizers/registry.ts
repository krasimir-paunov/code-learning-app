import type { VisualizerRuntime } from './contract.ts';

/** Discovered from src/visualizers/<id>/index.ts; every view stays a lazy chunk. */
const modules = import.meta.glob<{ default: VisualizerRuntime<unknown, unknown, unknown> }>(
  './*/index.ts',
  { eager: true },
);

export const visualizers: Readonly<Record<string, VisualizerRuntime<unknown, unknown, unknown>>> =
  Object.fromEntries(Object.values(modules).map((m) => [m.default.id, m.default]));
