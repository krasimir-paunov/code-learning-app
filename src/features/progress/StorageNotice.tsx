import { useState } from 'react';
import { Link } from 'react-router';
import { useProgress } from '../../engine/progress/store.ts';
import styles from './StorageNotice.module.css';

/** Non-blocking banner when progress cannot be saved or could not be read. */
export function StorageNotice() {
  const saveFailed = useProgress((s) => s.saveFailed);
  const recovered = useProgress((s) => s.recoveredFromError);
  const [dismissedRecovery, setDismissedRecovery] = useState(false);

  if (saveFailed) {
    return (
      <div className={styles.notice} role="status">
        Progress can&apos;t be saved in this browser (storage is full or blocked). It still works
        for this visit: <Link to="/profile#backup">export a backup</Link> to keep it.
      </div>
    );
  }
  if (recovered && !dismissedRecovery) {
    return (
      <div className={styles.notice} role="status">
        Saved progress could not be read, so a fresh profile was started. The old data was kept
        aside in this browser, not deleted.{' '}
        <button type="button" className={styles.dismiss} onClick={() => setDismissedRecovery(true)}>
          Dismiss
        </button>
      </div>
    );
  }
  return null;
}
