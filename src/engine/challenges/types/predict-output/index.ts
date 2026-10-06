import type { CompiledCodeBlock } from '../../../content/code.ts';
import { defineChallengeType, type GradeResult } from '../../contract.ts';
import { normalizeOutput } from '../../shared/normalize.ts';

export interface PredictOutputSpec {
  /** The program, without its output (that is what the learner predicts). */
  code: CompiledCodeBlock;
  /** Real stdout, proven by executing the program at build time. */
  answer: string;
  /** Optional multiple-choice mode: candidate outputs (one is the answer). */
  choices?: string[];
}

export type PredictOutputAnswer = string;

const lineCount = (text: string) => (text === '' ? 0 : text.split('\n').length);

export function gradePredictOutput(
  spec: PredictOutputSpec,
  answer: PredictOutputAnswer,
): GradeResult {
  const given = normalizeOutput(answer);
  if (given === '')
    return { passed: false, partial: true, feedback: 'Type what the program prints first.' };
  const expected = normalizeOutput(spec.answer);
  if (given === expected) return { passed: true, feedback: 'Exactly what it prints.' };
  const want = lineCount(expected);
  const got = lineCount(given);
  if (!spec.choices && want !== got) {
    return {
      passed: false,
      feedback: `Not quite. The program prints ${want} ${want === 1 ? 'line' : 'lines'}; your answer has ${got}.`,
    };
  }
  return {
    passed: false,
    feedback: 'Not quite. Trace the code line by line, keeping track of every variable.',
  };
}

export default defineChallengeType<PredictOutputSpec, PredictOutputAnswer>({
  type: 'predict-output',
  label: 'Predict the output',
  defaultXp: 10,
  grade: gradePredictOutput,
  View: () => import('./View.tsx'),
});
