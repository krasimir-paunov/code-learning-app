import styles from './Metrics.module.css';

/** A live counter (comparisons, swaps, checks) in tabular numerals. */
export function MetricCounter({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value.toLocaleString('en')}</span>
    </div>
  );
}

/** Big O label from the trace metadata. */
export function ComplexityTag({ label, value }: { label: string; value: string }) {
  return (
    <span className={styles.complexity}>
      <span className={styles.label}>{label}</span> <code>{value}</code>
    </span>
  );
}
