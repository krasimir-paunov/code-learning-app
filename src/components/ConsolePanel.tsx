import { CircleAlert, TriangleAlert } from 'lucide-react';
import type { ConsoleEntry, Diagnostic } from '../engine/runners/contract.ts';
import styles from './ConsolePanel.module.css';

interface ConsolePanelProps {
  entries: readonly ConsoleEntry[];
  diagnostics?: readonly Diagnostic[];
  /** Shown when there is nothing to show yet. */
  empty?: string;
}

/** Console output and errors from a run, announced politely as they arrive. */
export function ConsolePanel({
  entries,
  diagnostics = [],
  empty = 'No output yet.',
}: ConsolePanelProps) {
  return (
    <section className={styles.console} aria-label="Console">
      <div className={styles.title} aria-hidden="true">
        Console
      </div>
      <div role="log" aria-live="polite" className={styles.lines}>
        <ol>
          {entries.length === 0 && diagnostics.length === 0 && (
            <li className={styles.empty}>{empty}</li>
          )}
          {entries.map((entry, i) => (
            <li key={i} className={styles[entry.level]}>
              {entry.level === 'warn' && <TriangleAlert aria-hidden="true" />}
              {entry.level === 'error' && <CircleAlert aria-hidden="true" />}
              <span>{entry.text}</span>
            </li>
          ))}
          {diagnostics.map((d, i) => (
            <li key={`d${i}`} className={styles.error}>
              <CircleAlert aria-hidden="true" />
              <span>
                {d.line !== undefined && !d.message.includes(`:${d.line}`)
                  ? `Line ${d.line}: `
                  : ''}
                {d.message}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
