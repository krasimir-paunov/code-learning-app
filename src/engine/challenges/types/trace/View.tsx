import { Suspense, useState } from 'react';
import { TerminalLoader } from '../../../../effects/TerminalLoader.tsx';
import { traceViews } from '../../../../visualizers/registry.ts';
import type { ChallengeViewProps } from '../../contract.ts';
import type { TraceAnswer, TraceSpec } from './index.ts';

export default function TraceView({
  spec,
  state,
  submit,
  disabled,
}: ChallengeViewProps<TraceSpec, TraceAnswer>) {
  const [taken, setTaken] = useState<unknown[]>(state.passed ? spec.steps : []);
  const [wrongStep, setWrongStep] = useState<unknown>(undefined);
  const LearnerView = traceViews[spec.visualizer];

  if (!LearnerView) return <p>This visualizer has no trace mode.</p>;

  async function propose(step: unknown) {
    const result = await submit([...taken, step]);
    if (result.passed || result.partial) {
      setTaken((t) => [...t, step]);
      setWrongStep(undefined);
    } else {
      setWrongStep(step);
    }
  }

  return (
    <Suspense fallback={<TerminalLoader line={`loading ${spec.visualizer}`} />}>
      <LearnerView
        props={spec.props}
        steps={taken}
        wrongStep={wrongStep}
        done={taken.length >= spec.steps.length}
        disabled={disabled}
        propose={(step) => void propose(step)}
      />
    </Suspense>
  );
}
