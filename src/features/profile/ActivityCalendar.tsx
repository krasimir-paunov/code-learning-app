import { addDays } from '../../engine/progress/dates.ts';
import styles from './ActivityCalendar.module.css';

const WEEKS = 12;

interface ActivityCalendarProps {
  activity: Record<string, { xp: number; passed: number }>;
  today: string;
}

function intensity(xp: number): number {
  if (xp <= 0) return 0;
  if (xp < 20) return 1;
  if (xp < 50) return 2;
  return 3;
}

/** The last 12 weeks, one column per week; the summary is the accessible version. */
export function ActivityCalendar({ activity, today }: ActivityCalendarProps) {
  const total = WEEKS * 7;
  const days = Array.from({ length: total }, (_, i) => addDays(today, i - total + 1));
  const active = days.filter((day) => (activity[day]?.passed ?? 0) > 0).length;
  const xp = days.reduce((sum, day) => sum + (activity[day]?.xp ?? 0), 0);

  return (
    <figure className={styles.calendar}>
      <div
        className={styles.grid}
        role="img"
        aria-label={`Active on ${active} of the last ${total} days, ${xp} XP earned.`}
      >
        {days.map((day) => {
          const entry = activity[day];
          return (
            <span
              key={day}
              className={styles.cell}
              data-level={intensity(entry?.xp ?? 0)}
              title={`${day}: ${entry?.xp ?? 0} XP, ${entry?.passed ?? 0} challenges`}
            />
          );
        })}
      </div>
      <figcaption className={styles.caption}>
        {active} active {active === 1 ? 'day' : 'days'} in the last 12 weeks · {xp} XP
      </figcaption>
    </figure>
  );
}
