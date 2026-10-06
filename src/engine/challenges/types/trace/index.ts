import { defineChallengeType, type GradeResult } from '../../contract.ts';

export interface TraceSpec {
  visualizer: string;
  props: unknown;
  /** The algorithm's own steps, generated at build time by the visualizer's step generator. */
  steps: unknown[];
}

/** Every step the learner has proposed, in order (the correct prefix plus the newest one). */
export type TraceAnswer = unknown[];

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function gradeTrace(spec: TraceSpec, answer: TraceAnswer): GradeResult {
  const wrong = answer.findIndex((step, i) => !same(step, spec.steps[i]));
  if (wrong === -1 && answer.length >= spec.steps.length) {
    return { passed: true, feedback: `All ${spec.steps.length} steps, in order.` };
  }
  if (wrong === -1) {
    return {
      passed: false,
      partial: true,
      feedback:
        answer.length === 0
          ? 'Make the first step.'
          : `Step ${answer.length} is right. What comes next?`,
    };
  }
  return {
    passed: false,
    feedback: `Step ${wrong + 1} is not what the algorithm does next. Your first ${wrong} ${wrong === 1 ? 'step is' : 'steps are'} kept.`,
    highlight: { index: wrong, step: answer[wrong] },
  };
}

export default defineChallengeType<TraceSpec, TraceAnswer>({
  type: 'trace',
  label: 'Trace it by hand',
  defaultXp: 10,
  grade: gradeTrace,
  View: () => import('./View.tsx'),
});
