import { Button } from '../../components/Button.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { Glitch } from '../../effects/Glitch.tsx';
import { totalXp } from '../../engine/progress/derive.ts';
import { useProgress } from '../../engine/progress/store.ts';
import { levelForXp, xpForLevel } from '../../engine/progress/xp.ts';
import styles from './LevelUpOverlay.module.css';

/** Plays once per level: shown when the derived level passes the last celebrated one. */
export function LevelUpOverlay() {
  const level = useProgress((s) => levelForXp(totalXp(s.progress)));
  const celebrated = useProgress((s) => s.progress.lastCelebratedLevel);
  const markLevelCelebrated = useProgress((s) => s.markLevelCelebrated);
  const open = level > celebrated;
  const close = () => markLevelCelebrated(level);

  return (
    <Dialog
      open={open}
      onClose={close}
      className={styles.dialog}
      title={<Glitch text={`Level ${level}`} className={styles.title} />}
      actions={
        <Button variant="primary" onClick={close}>
          Keep going
        </Button>
      }
    >
      <p>
        You reached <strong>level {level}</strong>. The next level starts at{' '}
        {xpForLevel(level + 1).toLocaleString('en')} XP.
      </p>
    </Dialog>
  );
}
