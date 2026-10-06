import { useEffect, useState } from 'react';
import styles from './TerminalLoader.module.css';

interface TerminalLoaderProps {
  /** Plain text of the loading line, e.g. "loading lesson algo.binary-search". */
  line: string;
  /** Real progress (0–1) for long downloads such as a runtime; omit when unknown. */
  progress?: number;
  /** Nothing renders before this delay, so fast loads never flash a loader. */
  delayMs?: number;
}

export function TerminalLoader({ line, progress, delayMs = 300 }: TerminalLoaderProps) {
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return;
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  if (!visible) return null;
  const percent = progress === undefined ? undefined : Math.round(progress * 100);

  return (
    <div className={styles.loader} role="status">
      <span className={styles.prompt} aria-hidden="true">
        &gt;
      </span>
      <span className={styles.line} style={{ ['--chars' as string]: line.length + 1 }}>
        {line}…
      </span>
      <span className={styles.cursor} aria-hidden="true" />
      {percent !== undefined && <span className={styles.percent}>{percent}%</span>}
    </div>
  );
}
