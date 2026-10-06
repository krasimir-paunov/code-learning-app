import { Check, X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cx } from '../../../components/cx.ts';
import styles from './OptionList.module.css';

export interface OptionItem {
  /** Trusted, build-time HTML (inline Markdown or highlighted code). */
  html: string;
  /** Shown under the option once it has been judged. */
  note?: ReactNode;
  verdict?: 'right' | 'wrong';
}

interface OptionListProps {
  legend: string;
  options: readonly OptionItem[];
  selected: readonly number[];
  onChange: (selected: number[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  /** Options are code (monospace, pre-formatted). */
  code?: boolean;
}

/** Native radio/checkbox group with rich labels; each judged option explains itself. */
export function OptionList({
  legend,
  options,
  selected,
  onChange,
  multiple = false,
  disabled,
  code = false,
}: OptionListProps) {
  const name = useId();
  return (
    <fieldset className={styles.list} disabled={disabled}>
      <legend className="visually-hidden">{legend}</legend>
      {options.map((option, i) => {
        const checked = selected.includes(i);
        return (
          <div key={i} className={styles.item} data-verdict={option.verdict}>
            <label className={cx(styles.option, checked && styles.checked)}>
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                checked={checked}
                onChange={() =>
                  onChange(
                    multiple ? (checked ? selected.filter((s) => s !== i) : [...selected, i]) : [i],
                  )
                }
              />
              <span
                className={cx(styles.label, code && styles.code)}
                // Build-time HTML from repository content.
                dangerouslySetInnerHTML={{ __html: option.html }}
              />
              {option.verdict === 'right' && (
                <Check aria-label="Correct" className={styles.right} />
              )}
              {option.verdict === 'wrong' && <X aria-label="Incorrect" className={styles.wrong} />}
            </label>
            {option.note && <div className={styles.note}>{option.note}</div>}
          </div>
        );
      })}
    </fieldset>
  );
}
