import { ArrowRight, Map as MapIcon, Trophy } from 'lucide-react';
import { LinkButton } from '../../components/Button.tsx';
import { InlineCode } from '../../components/InlineCode.tsx';
import type { SkillNode } from '../../engine/skilltree/types.ts';
import styles from './Lesson.module.css';

interface LessonCompleteCardProps {
  xp: number;
  next?: SkillNode;
}

/** Shown inline when the last challenge passes (no effects: it is a reading surface). */
export function LessonCompleteCard({ xp, next }: LessonCompleteCardProps) {
  return (
    <section className={styles.complete} aria-labelledby="lesson-complete">
      <Trophy aria-hidden="true" className={styles.completeIcon} />
      <div>
        <h2 id="lesson-complete" className={styles.completeTitle}>
          Lesson complete
        </h2>
        <p>
          You earned <strong>{xp} XP</strong> in this lesson.
        </p>
      </div>
      <div className={styles.completeActions}>
        {next && (
          <LinkButton to={`/learn/${next.id}`} variant="primary" icon={<ArrowRight />}>
            Next: <InlineCode text={next.title} />
          </LinkButton>
        )}
        <LinkButton to={next ? `/map/${next.module}` : '/map'} icon={<MapIcon />}>
          Back to the map
        </LinkButton>
      </div>
    </section>
  );
}
