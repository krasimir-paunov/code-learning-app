import type { ComponentType } from 'react';
import type { Runner } from '../runners/contract.ts';

/**
 * Challenge plugins (ARCHITECTURE §8). Each type lives in challenges/types/<type>/ and is split
 * so the browser never ships build tooling:
 * - build.ts  (build time): Zod schema, compile to a runtime spec, solution text, build checks
 * - index.ts  (runtime):    default XP, pure grader, lazy View
 */

export interface GradeDetail {
  label: string;
  passed: boolean;
  message?: string;
}

export interface GradeResult {
  passed: boolean;
  /** Specific, plain text (backticks render as code): which blank, which test, which step. */
  feedback: string;
  details?: GradeDetail[];
  /**
   * A correct intermediate step in a multi-step challenge (the right line in find-bug, a
   * correct trace step). Not a failure: it does not count as an attempt.
   */
  partial?: boolean;
  /** Type-specific pointers for the view (wrong blank names, first wrong step...). */
  highlight?: unknown;
}

export interface RunnerRegistry {
  get(id: string): Promise<Runner | undefined>;
}

export interface GradeContext {
  runners: RunnerRegistry;
}

export interface ChallengeAttemptState {
  attempts: number;
  hintsUsed: number;
  revealed: boolean;
  passed: boolean;
  lastResult?: GradeResult;
}

export interface ChallengeViewProps<Spec, Answer> {
  spec: Spec;
  /** Stable id prefix for labels inside the view. */
  id: string;
  state: ChallengeAttemptState;
  /** Grades and records the attempt; resolves with the result the shell also shows. */
  submit(answer: Answer): Promise<GradeResult>;
  /** Locked lessons render challenges read-only. */
  disabled: boolean;
}

export interface ChallengeRuntime<Spec = never, Answer = never> {
  type: string;
  /** Human label, e.g. "Predict the output". */
  label: string;
  defaultXp: number;
  grade(spec: Spec, answer: Answer, ctx: GradeContext): GradeResult | Promise<GradeResult>;
  View: () => Promise<{ default: ComponentType<ChallengeViewProps<Spec, Answer>> }>;
}

/** Keeps each type's Spec/Answer types tied together at the definition site. */
export function defineChallengeType<Spec, Answer>(
  definition: ChallengeRuntime<Spec, Answer>,
): ChallengeRuntime<Spec, Answer> {
  return definition;
}
