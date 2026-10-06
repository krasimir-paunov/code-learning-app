import { useEffect, useState } from 'react';
import { cx } from '../../components/cx.ts';
import styles from './Lesson.module.css';

const SECTIONS = [
  { id: 'concept', label: 'Concept' },
  { id: 'playground', label: 'Playground' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'production', label: 'In production' },
  { id: 'mistake', label: 'Common mistake' },
  { id: 'recap', label: 'Recap' },
] as const;

interface SectionRailProps {
  passed: number;
  total: number;
}

/** Sticky section rail on wide screens; a challenge progress bar on small ones. */
export function SectionRail({ passed, total }: SectionRailProps) {
  const [active, setActive] = useState<string>('concept');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    for (const { id } of SECTIONS) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav aria-label="Lesson sections" className={styles.rail}>
        <ol>
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cx(styles.railLink, active === id && styles.railActive)}
                aria-current={active === id ? 'location' : undefined}
              >
                {label}
                {id === 'challenges' && (
                  <span className={styles.railCount}>
                    {passed}/{total}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className={styles.progressBar} aria-hidden="true">
        <span style={{ inlineSize: `${total ? (passed / total) * 100 : 0}%` }} />
      </div>
    </>
  );
}
