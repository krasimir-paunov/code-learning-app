import { useMemo } from 'react';
import type { TraceViewProps } from '../contract.ts';
import { ArrayView } from '../shared/ArrayView.tsx';
import { TraceCursor } from '../shared/trace.ts';
import type { SearchTraceProps } from './build.ts';
import { SEARCH_TITLES, SEARCHES } from './model.ts';
import styles from './View.module.css';

/**
 * Learner-drives mode: the learner clicks the element the algorithm checks next. After each
 * correct click the array shows what that check ruled out (the trace's own frame).
 */
export default function SearchTraceView({
  props,
  steps,
  wrongStep,
  done,
  disabled,
  propose,
}: TraceViewProps<SearchTraceProps, number>) {
  const cursor = useMemo(
    () => new TraceCursor(props.array, (xs) => SEARCHES[props.algorithm](xs, props.target)),
    [props],
  );
  const frame = cursor.frame(steps.length);
  // Hide the pointer to the next probe: that would give the answer away.
  const shown = {
    ...frame,
    pointers: steps.length === 0 ? {} : frame.pointers,
    active: [],
    activeKind: null,
  };

  return (
    <div className={styles.race}>
      <p className={styles.target}>
        {SEARCH_TITLES[props.algorithm]} is looking for <strong>{props.target}</strong>.{' '}
        {done ? 'Done.' : `Click check ${steps.length + 1}.`}
      </p>
      <ArrayView
        frame={shown}
        label={`Sorted array of ${props.array.length} numbers. Choose the element checked next.`}
        onSelect={(i) => propose(i)}
        wrongIndex={typeof wrongStep === 'number' ? wrongStep : undefined}
        disabled={disabled || done}
      />
      <p className={styles.status} aria-live="polite">
        {steps.length > 0 && !done ? frame.note : ''}
        {done ? frame.note : ''}
      </p>
    </div>
  );
}
