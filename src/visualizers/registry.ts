import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { TraceViewProps, VisualizerRuntime, VisualizerViewProps } from './contract.ts';

/** Discovered from src/visualizers/<id>/index.ts; every view stays a lazy chunk. */
const modules = import.meta.glob<{ default: VisualizerRuntime<unknown, unknown, unknown> }>(
  './*/index.ts',
  { eager: true },
);

export const visualizers: Readonly<Record<string, VisualizerRuntime<unknown, unknown, unknown>>> =
  Object.fromEntries(Object.values(modules).map((m) => [m.default.id, m.default]));

type Lazy<P> = LazyExoticComponent<ComponentType<P>>;

/** Lazy views created once at load (never during render); nothing downloads until shown. */
export const visualizerViews: Readonly<Record<string, Lazy<VisualizerViewProps<unknown>>>> =
  Object.fromEntries(Object.entries(visualizers).map(([id, v]) => [id, lazy(v.load)]));

export const traceViews: Readonly<Record<string, Lazy<TraceViewProps<unknown, unknown>>>> =
  Object.fromEntries(
    Object.entries(visualizers).flatMap(([id, v]) =>
      v.loadTrace ? [[id, lazy(v.loadTrace)]] : [],
    ),
  );
