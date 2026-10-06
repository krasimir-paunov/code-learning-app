import { Check, X } from 'lucide-react';
import type { TestResult } from '../engine/runners/contract.ts';
import styles from './TestResults.module.css';

/** Per-test pass/fail with the failing assertion's message. */
export function TestResults({ tests }: { tests: readonly TestResult[] }) {
  if (tests.length === 0) return null;
  const passed = tests.filter((t) => t.passed).length;
  return (
    <section className={styles.results} aria-label="Test results">
      <p className={styles.summary}>
        {passed} of {tests.length} tests passed
      </p>
      <ul className={styles.list}>
        {tests.map((test) => (
          <li key={test.name} data-passed={test.passed}>
            {test.passed ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
            <span>
              <span className="visually-hidden">{test.passed ? 'Passed: ' : 'Failed: '}</span>
              {test.name}
              {test.message && <span className={styles.message}>{test.message}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
