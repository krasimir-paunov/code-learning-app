import { defineChallengeType, type GradeResult } from '../../contract.ts';

export interface ReorderSpec {
  /** Items in their starting (shuffled) order. */
  items: { id: string; html: string }[];
  /** Every accepted order of the needed item ids. */
  orders: string[][];
  /** Items that are not part of any answer. */
  distractors: string[];
  /** Render items as code. */
  code: boolean;
}

export interface ReorderAnswer {
  order: string[];
  /** Items the learner marked "not needed". */
  excluded: string[];
}

function correctPositions(order: string[], expected: string[]): number {
  return order.filter((id, i) => expected[i] === id).length;
}

export function gradeReorder(spec: ReorderSpec, answer: ReorderAnswer): GradeResult {
  const used = answer.order.filter((id) => !answer.excluded.includes(id));
  const wronglyUsed = used.filter((id) => spec.distractors.includes(id));
  const wronglyExcluded = answer.excluded.filter((id) => !spec.distractors.includes(id));
  if (wronglyUsed.length > 0) {
    return {
      passed: false,
      feedback: `${wronglyUsed.length === 1 ? 'One item does' : `${wronglyUsed.length} items do`} not belong in the answer. Mark it "not needed".`,
      highlight: { ids: wronglyUsed },
    };
  }
  if (wronglyExcluded.length > 0) {
    return {
      passed: false,
      feedback: 'An item you marked "not needed" is part of the answer.',
      highlight: { ids: wronglyExcluded },
    };
  }
  if (
    spec.orders.some(
      (order) => order.length === used.length && order.every((id, i) => used[i] === id),
    )
  ) {
    return { passed: true, feedback: 'Right order.' };
  }
  // Report against the closest accepted order.
  const best = spec.orders.reduce((a, b) =>
    correctPositions(used, b) > correctPositions(used, a) ? b : a,
  );
  const right = correctPositions(used, best);
  const firstWrong = used.find((id, i) => best[i] !== id);
  return {
    passed: false,
    feedback: `${right} of ${used.length} are in the right place. The first one out of place is highlighted.`,
    highlight: { ids: firstWrong ? [firstWrong] : [] },
  };
}

export default defineChallengeType<ReorderSpec, ReorderAnswer>({
  type: 'reorder',
  label: 'Put in order',
  defaultXp: 10,
  grade: gradeReorder,
  View: () => import('./View.tsx'),
});
