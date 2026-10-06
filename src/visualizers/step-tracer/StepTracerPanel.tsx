import { cx } from '../../components/cx.ts';
import styles from './StepTracerPanel.module.css';

interface StepTracerPanelProps {
  /** Pre-highlighted reference code, one HTML string per line. */
  codeLines: readonly string[];
  /** 1-based line the current step executes. */
  line?: number;
  vars?: Readonly<Record<string, string | number | boolean | null>>;
  label: string;
}

/** Code with the executing line highlighted, beside a watch list of variables. */
export function StepTracerPanel({ codeLines, line, vars, label }: StepTracerPanelProps) {
  return (
    <div className={styles.panel}>
      <ol className={styles.code} aria-label={label}>
        {codeLines.map((html, i) => (
          <li
            key={i}
            className={cx(styles.line, line === i + 1 && styles.current)}
            aria-current={line === i + 1 ? 'step' : undefined}
          >
            <span className={styles.number} aria-hidden="true">
              {i + 1}
            </span>
            {/* Build-time highlighted reference code. */}
            <code dangerouslySetInnerHTML={{ __html: html || ' ' }} />
          </li>
        ))}
      </ol>
      <dl className={styles.vars} aria-label="Variables">
        {Object.entries(vars ?? {}).map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value === null ? 'null' : String(value)}</dd>
          </div>
        ))}
        {!vars && <div className={styles.empty}>Step forward to see the variables.</div>}
      </dl>
    </div>
  );
}
