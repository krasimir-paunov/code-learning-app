import { useId, type ReactNode } from 'react';
import styles from './SegmentedControl.module.css';
import { cx } from './cx.ts';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hideLabel?: boolean;
  size?: 'md' | 'sm';
}

/** A radio group styled as segments: arrow keys, labels and state come from native radios. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
  size = 'md',
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={cx(styles.group, size === 'sm' && styles.sm)}>
      <legend className={hideLabel ? 'visually-hidden' : styles.legend}>{label}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
