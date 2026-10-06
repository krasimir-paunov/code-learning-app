import { Download, Upload } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../components/Button.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { toLocalDate } from '../../engine/progress/dates.ts';
import { summarize, type ProgressSummary } from '../../engine/progress/derive.ts';
import { createExport, exportFileName, parseBackup } from '../../engine/progress/import-export.ts';
import type { Progress } from '../../engine/progress/schema.ts';
import { useProgress } from '../../engine/progress/store.ts';
import styles from './ProfilePage.module.css';
import { downloadText } from './download.ts';

const ROWS: [keyof ProgressSummary, string][] = [
  ['lessonsCompleted', 'Lessons completed'],
  ['challengesPassed', 'Challenges passed'],
  ['xp', 'XP'],
  ['level', 'Level'],
  ['longestStreak', 'Longest streak (days)'],
];

export function BackupPanel() {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const importProgress = useProgress((s) => s.importProgress);
  const progress = useProgress((s) => s.progress);
  const [pending, setPending] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const today = toLocalDate(new Date());

  function exportNow() {
    const now = new Date();
    downloadText(exportFileName(now), JSON.stringify(createExport(progress, now), null, 2));
    setStatus('Backup downloaded.');
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStatus('');
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setPending(result.progress);
  }

  function apply(mode: 'replace' | 'merge') {
    if (!pending) return;
    importProgress(pending, mode);
    setPending(null);
    setStatus(
      mode === 'replace'
        ? 'Progress replaced from the backup.'
        : 'Backup merged into your progress.',
    );
  }

  const current = summarize(progress, today);
  const incoming = pending ? summarize(pending, today) : null;

  return (
    <div className={styles.stack}>
      <p className={styles.muted}>
        Progress lives only in this browser. Export a backup to move it to another device or keep it
        safe; importing never applies a damaged file.
      </p>
      <div className={styles.row}>
        <Button icon={<Download />} onClick={exportNow}>
          Export backup
        </Button>
        <Button icon={<Upload />} onClick={() => inputRef.current?.click()}>
          Import backup
        </Button>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-label="Backup file"
          aria-describedby={error ? errorId : undefined}
          onChange={onFile}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p className={styles.muted} aria-live="polite">
        {status}
      </p>

      <Dialog
        open={incoming !== null}
        onClose={() => setPending(null)}
        title="Import this backup?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button onClick={() => apply('merge')}>Merge</Button>
            <Button variant="primary" onClick={() => apply('replace')}>
              Replace
            </Button>
          </>
        }
      >
        <table className={styles.compare}>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Measure</span>
              </th>
              <th scope="col">Backup</th>
              <th scope="col">Current</th>
            </tr>
          </thead>
          <tbody>
            {incoming &&
              ROWS.map(([key, label]) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  <td>{incoming[key]}</td>
                  <td>{current[key]}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className={styles.muted}>
          <strong>Replace</strong> makes this device match the backup. <strong>Merge</strong> keeps
          everything from both (earliest pass and higher XP per challenge); your settings stay.
        </p>
      </Dialog>
    </div>
  );
}
