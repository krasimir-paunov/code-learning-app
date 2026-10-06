import type { ComponentType } from 'react';

/**
 * Visualizer plugins (ARCHITECTURE §7): src/visualizers/<id>/
 * - build.ts  (build time): props schema (+ trace step generator for `trace` challenges)
 * - model.ts  pure, unit-tested logic (step generators, simulations)
 * - index.ts  runtime registration with lazy views
 * - View.tsx  default export, loaded only when a lesson shows the visualizer
 */
export interface VisualizerViewProps<Props> {
  props: Props;
  /** Lesson context for labels ("Playground for Binary search"). */
  title: string;
}

/** Learner-drives mode: the learner proposes the next step; the trace verifies it. */
export interface TraceViewProps<Props, Step> {
  props: Props;
  /** Correct steps taken so far. */
  steps: readonly Step[];
  /** The step the learner just proposed, when it was wrong (to highlight it). */
  wrongStep?: Step;
  done: boolean;
  disabled: boolean;
  propose(step: Step): void;
}

export interface VisualizerRuntime<Props = never, TraceProps = never, Step = never> {
  id: string;
  load: () => Promise<{ default: ComponentType<VisualizerViewProps<Props>> }>;
  loadTrace?: () => Promise<{ default: ComponentType<TraceViewProps<TraceProps, Step>> }>;
}

export function defineVisualizer<Props, TraceProps = never, Step = never>(
  definition: VisualizerRuntime<Props, TraceProps, Step>,
): VisualizerRuntime<Props, TraceProps, Step> {
  return definition;
}
