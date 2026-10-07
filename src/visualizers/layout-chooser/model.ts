/**
 * Grid or Flexbox for a job: each scenario says which one fits and why, and what goes wrong
 * with the other. The view renders both for real so the learner can see the difference.
 */

export type Layout = 'flex' | 'grid';

export interface Scenario {
  better: Layout;
  /** Why the better layout fits this job. */
  why: string;
  /** What goes wrong with the other one. */
  instead: string;
}

export function verdict(scenario: Scenario, choice: Layout): { fits: boolean; text: string } {
  return choice === scenario.better
    ? { fits: true, text: scenario.why }
    : { fits: false, text: scenario.instead };
}

/** The two questions that settle most cases. */
export function recommend(answers: { twoDirections: boolean; sizeFromContent: boolean }): Layout {
  if (answers.twoDirections) return 'grid';
  return answers.sizeFromContent ? 'flex' : 'grid';
}
