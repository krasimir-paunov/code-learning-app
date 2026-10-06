import { Star, Swords } from 'lucide-react';
import { STATE_LABELS } from '../../engine/skilltree/summary.ts';
import type { NodeState } from '../../engine/skilltree/unlock.ts';
import styles from './MapLegend.module.css';
import { StateIcon } from './StateIcon.tsx';

const STATES: NodeState[] = ['available', 'in-progress', 'completed', 'locked', 'planned'];

export function MapLegend() {
  return (
    <details className={styles.legend}>
      <summary>Legend</summary>
      <dl className={styles.items}>
        {STATES.map((state) => (
          <div key={state} className={styles.item} data-state={state}>
            <dt>
              <StateIcon state={state} className={styles.icon} />
              {STATE_LABELS[state]}
            </dt>
            <dd>
              {
                {
                  available: 'Ready to start.',
                  'in-progress': 'Started, not finished.',
                  completed: 'Every challenge passed.',
                  locked: 'Finish its prerequisites first (the concept is still readable).',
                  planned: 'On the map, not built yet.',
                }[state]
              }
            </dd>
          </div>
        ))}
        <div className={styles.item}>
          <dt>Core / Depth</dt>
          <dd>
            Core lessons are full size and job-essential; depth lessons are smaller and optional.
          </dd>
        </div>
        <div className={styles.item}>
          <dt>
            <Star aria-hidden="true" className={styles.icon} /> Recommended first
          </dt>
          <dd>Open, but another lesson is suggested first. Skippable per track.</dd>
        </div>
        <div className={styles.item}>
          <dt>
            <Swords aria-hidden="true" className={styles.icon} /> Boss
          </dt>
          <dd>A 10-minute mixed challenge with bonus XP.</dd>
        </div>
        <div className={styles.item}>
          <dt>Lines</dt>
          <dd>
            Solid: required. Dotted: recommended. Dashed: related. On the overview, lines between
            tracks appear for the module you point at or focus.
          </dd>
        </div>
      </dl>
    </details>
  );
}
