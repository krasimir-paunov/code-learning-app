import { useMemo } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { TRACEABLE } from '../shared/algorithms/traceable.ts';
import { ArrayView } from '../shared/ArrayView.tsx';
import { StepPlayer } from '../shared/StepPlayer.tsx';
import { TraceCursor } from '../shared/trace.ts';
import { useStepPlayer } from '../shared/use-step-player.ts';
import type { StepTracerProps } from './build.ts';
import { StepTracerPanel } from './StepTracerPanel.tsx';
import styles from './View.module.css';

/** Follows an algorithm line by line: code, variables and the array, from one trace. */
export default function StepTracerView({ props }: VisualizerViewProps<StepTracerProps>) {
  const algorithm = TRACEABLE[props.algorithm];
  const cursor = useMemo(
    () => new TraceCursor(props.array, (xs) => algorithm.run(xs, props.target)),
    [props.array, props.target, algorithm],
  );
  const player = useStepPlayer(cursor.length, 1);
  const frame = cursor.frame(player.index);

  return (
    <div className={styles.tracer}>
      <p className={styles.target}>
        {algorithm.title} for <strong>{props.target}</strong>
      </p>
      <ArrayView frame={frame} label={`Array of ${props.array.length} sorted numbers`} />
      <StepTracerPanel
        codeLines={props.codeLines}
        line={frame.line}
        vars={frame.vars}
        label={`${algorithm.title} code`}
      />
      <StepPlayer player={player} narration={frame.note} />
    </div>
  );
}
