import type { CSSProperties } from 'react';
import { cx } from '../../components/cx.ts';
import styles from './ArrayView.module.css';
import type { Frame, Mark } from './trace.ts';

interface ArrayViewProps {
  frame: Pick<Frame, 'array' | 'marks' | 'pointers' | 'active' | 'activeKind'>;
  /** Cells show values (searching); bars show magnitude (sorting). */
  mode?: 'cells' | 'bars';
  /** Accessible description of the whole array (the live region narrates changes). */
  label: string;
  /** Learner-drives mode: each cell becomes a button. */
  onSelect?: (index: number) => void;
  /** A wrong proposal to flag. */
  wrongIndex?: number;
  disabled?: boolean;
  showIndices?: boolean;
}

const MARK_LABEL: Record<Mark, string> = {
  sorted: 'sorted',
  found: 'found',
  discarded: 'ruled out',
  pivot: 'pivot',
  candidate: 'candidate',
};

/** Array primitive: value cells or bars, with marks, the active pair and pointer labels. */
export function ArrayView({
  frame,
  mode = 'cells',
  label,
  onSelect,
  wrongIndex,
  disabled,
  showIndices = true,
}: ArrayViewProps) {
  const max = Math.max(1, ...frame.array);
  const pointerAt = new Map<number, string[]>();
  for (const [name, at] of Object.entries(frame.pointers)) {
    if (at === null || at === undefined) continue;
    pointerAt.set(at, [...(pointerAt.get(at) ?? []), name]);
  }
  const dense = frame.array.length > 40;

  return (
    <div
      className={cx(styles.array, styles[mode], dense && styles.dense)}
      role={onSelect ? 'group' : 'img'}
      aria-label={label}
      style={{ ['--count' as string]: frame.array.length } as CSSProperties}
    >
      {frame.array.map((value, i) => {
        const mark = frame.marks[i] ?? null;
        const active = frame.active.includes(i);
        const pointers = pointerAt.get(i);
        const content = (
          <>
            {mode === 'bars' ? (
              <span className={styles.bar} style={{ blockSize: `${(value / max) * 100}%` }} />
            ) : (
              !dense && <span className={styles.value}>{value}</span>
            )}
            {showIndices && !dense && <span className={styles.index}>{i}</span>}
            {pointers && !dense && <span className={styles.pointer}>{pointers.join(' ')}</span>}
          </>
        );
        const common = {
          className: cx(styles.cell, active && styles.active),
          'data-mark': mark ?? undefined,
          'data-kind': active ? (frame.activeKind ?? undefined) : undefined,
          'data-wrong': wrongIndex === i || undefined,
        };
        return onSelect ? (
          <button
            key={i}
            type="button"
            {...common}
            disabled={disabled || mark === 'discarded' || mark === 'found'}
            onClick={() => onSelect(i)}
            aria-label={`Index ${i}, value ${value}${mark ? `, ${MARK_LABEL[mark]}` : ''}`}
          >
            {content}
          </button>
        ) : (
          <span key={i} {...common}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
