import { Flame } from 'lucide-react';
import { Link } from 'react-router';
import { totalXp } from '../../engine/progress/derive.ts';
import { toLocalDate } from '../../engine/progress/dates.ts';
import { useProgress } from '../../engine/progress/store.ts';
import { currentStreak } from '../../engine/progress/streak.ts';
import { levelProgress } from '../../engine/progress/xp.ts';
import styles from './ProgressWidgets.module.css';

/** Level, XP bar and streak in the top bar; one link to the profile with a full description. */
export function ProgressWidgets() {
  const xp = useProgress((s) => totalXp(s.progress));
  const streak = useProgress((s) => currentStreak(s.progress.activity, toLocalDate(new Date())));
  const { level, into, span, fraction } = levelProgress(xp);
  const label = `Level ${level}, ${into} of ${span} XP to level ${level + 1}, ${streak}-day streak. Open profile.`;

  return (
    <Link to="/profile" className={styles.widgets} aria-label={label}>
      <span className={styles.level} aria-hidden="true">
        Lv {level}
      </span>
      <span className={styles.bar} aria-hidden="true">
        <span className={styles.fill} style={{ inlineSize: `${Math.round(fraction * 100)}%` }} />
      </span>
      <span className={styles.streak} aria-hidden="true" data-active={streak > 0}>
        <Flame />
        {streak}
      </span>
    </Link>
  );
}
