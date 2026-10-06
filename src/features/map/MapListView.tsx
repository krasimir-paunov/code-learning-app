import { Star, Swords } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { InlineCode } from '../../components/InlineCode.tsx';
import { ProgressRing } from '../../components/ProgressRing.tsx';
import { manifest } from '../../engine/content/manifest.ts';
import {
  STATE_LABELS,
  summarizeModule,
  visibleInFilter,
  type TierFilter,
} from '../../engine/skilltree/summary.ts';
import type { NodeStatus } from '../../engine/skilltree/unlock.ts';
import styles from './MapListView.module.css';
import { StateIcon } from './StateIcon.tsx';

interface MapListViewProps {
  tier: TierFilter;
  statuses: Record<string, NodeStatus>;
  /** Scroll this module into view (when coming from a module link). */
  focusModule?: string;
}

/** The same data as the map, as nested lists: the default on phones and for screen readers. */
export function MapListView({ tier, statuses, focusModule }: MapListViewProps) {
  useEffect(() => {
    if (focusModule) document.getElementById(`module-${focusModule}`)?.scrollIntoView();
  }, [focusModule]);

  return (
    <div className={styles.list}>
      {manifest.tracks.map((track) => (
        <section
          key={track.id}
          aria-labelledby={`track-${track.id}`}
          className={styles.track}
          style={{ ['--track' as string]: `var(--${track.color})` }}
        >
          <h2 id={`track-${track.id}`} className={styles.trackTitle}>
            {track.title}
          </h2>
          {track.modules.map((moduleId) => {
            const module = manifest.modules[moduleId];
            if (!module) return null;
            const summary = summarizeModule(module, manifest, statuses, tier);
            const lessons = module.lessons
              .map((id) => manifest.nodes[id])
              .filter((n) => n !== undefined && visibleInFilter(n, tier));
            if (lessons.length === 0) return null;
            return (
              <section key={module.id} id={`module-${module.id}`} className={styles.module}>
                <h3 className={styles.moduleTitle}>
                  {module.boss && <Swords aria-hidden="true" className={styles.icon} />}
                  {module.title}
                  <ProgressRing
                    value={summary.completed}
                    max={Math.max(1, summary.published)}
                    size={20}
                    label={`${summary.completed} of ${summary.published} playable lessons completed`}
                  />
                </h3>
                <ol className={styles.lessons}>
                  {lessons.map((node) => {
                    if (!node) return null;
                    const status = statuses[node.id];
                    const state = status?.state ?? 'planned';
                    const title = <InlineCode text={node.title} />;
                    return (
                      <li key={node.id} className={styles.lesson} data-state={state}>
                        <StateIcon state={state} className={styles.icon} />
                        <span className={styles.lessonTitle}>
                          {state === 'planned' ? (
                            title
                          ) : (
                            <Link to={`/learn/${node.id}`}>{title}</Link>
                          )}
                          {status?.recommendationPending && (
                            <span className={styles.recommended}>
                              <Star aria-hidden="true" /> recommended first
                            </span>
                          )}
                        </span>
                        <span className={styles.meta}>
                          {STATE_LABELS[state]} · {node.minutes} min
                          {node.tier === 'extended' && ' · Depth'}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </section>
      ))}
    </div>
  );
}
