import type { RunResult } from '../../../runners/contract.ts';
import { defineChallengeType, type GradeResult } from '../../contract.ts';

export interface LiveCodeSpec {
  /** Runner plugin id ('web-sandbox' now; 'dotnet-wasm' in Phase 7 via its own type). */
  runner: string;
  /** Starting files. */
  files: Record<string, string>;
  editable: string[];
  tests: string;
  preview: boolean;
}

export type LiveCodeAnswer = Record<string, string>;

/** Turns a runner result into specific feedback (pure, shared by every code-running type). */
export function evaluateRun(result: RunResult): GradeResult {
  const first = result.diagnostics[0]?.message;
  if (result.status === 'compile-error') {
    return {
      passed: false,
      feedback: `Your code has a syntax error: ${first ?? 'see the console'}.`,
    };
  }
  if (result.status === 'timeout') {
    return {
      passed: false,
      feedback: 'Your code did not finish in time. Is there a loop that never ends?',
    };
  }
  const details = result.tests.map((t) => ({
    label: t.name,
    passed: t.passed,
    message: t.message,
  }));
  const passed = result.tests.filter((t) => t.passed).length;
  if (result.tests.length > 0 && passed === result.tests.length) {
    return { passed: true, feedback: `All ${passed} tests passed.`, details };
  }
  const failure = result.tests.find((t) => !t.passed);
  const error = result.status === 'runtime-error' && first ? ` Your code threw: ${first}.` : '';
  return {
    passed: false,
    feedback: `${passed} of ${result.tests.length} tests passed.${
      failure ? ` First failure, "${failure.name}": ${failure.message ?? 'failed'}.` : ''
    }${error}`,
    details,
  };
}

export default defineChallengeType<LiveCodeSpec, LiveCodeAnswer>({
  type: 'live-code',
  label: 'Write the code',
  defaultXp: 20,
  async grade(spec, answer, ctx) {
    const runner = await ctx.runners.get(spec.runner);
    if (!runner) return { passed: false, feedback: `The ${spec.runner} runner is not available.` };
    await runner.prepare();
    return evaluateRun(await runner.run({ files: answer, tests: spec.tests }));
  },
  View: () => import('./View.tsx'),
});
