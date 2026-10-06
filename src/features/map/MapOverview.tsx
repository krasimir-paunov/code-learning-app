import { Swords } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ProgressRing } from '../../components/ProgressRing.tsx';
import { manifest } from '../../engine/content/manifest.ts';
import { MODULE_CARD, OVERVIEW } from '../../engine/skilltree/layout-constants.ts';
import { summarizeModule, type TierFilter } from '../../engine/skilltree/summary.ts';
import { frontier, type NodeStatus } from '../../engine/skilltree/unlock.ts';
import { useMotionPreference } from '../../effects/motion.ts';
import styles from './MapOverview.module.css';
import { useArrowNavigation } from './use-arrow-navigation.ts';

interface MapOverviewProps {
  tier: TierFilter;
  statuses: Record<string, NodeStatus>;
  /** Current query string, kept when zooming into a module. */
  search: string;
}

const MODULE_STATE_LABEL = {
  planned: 'Coming soon',
  locked: 'Locked',
  available: 'Open',
  completed: 'Completed',
} as const;

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const y1 = from.y + MODULE_CARD.height / 2;
  const y2 = to.y - MODULE_CARD.height / 2;
  const bend = Math.max(24, (y2 - y1) / 2);
  return `M ${from.x} ${y1} C ${from.x} ${y1 + bend}, ${to.x} ${y2 - bend}, ${to.x} ${y2}`;
}

/** Overview zoom: tracks as lanes, modules as cards, module-level dependency edges. */
export function MapOverview({ tier, statuses, search }: MapOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frontierRef = useRef<HTMLAnchorElement>(null);
  const motion = useMotionPreference();
  useArrowNavigation(containerRef);
  const frontierLesson = frontier(manifest, statuses);
  const frontierModule = frontierLesson ? manifest.nodes[frontierLesson]?.module : undefined;
  const { width, height, lanes } = manifest.overview;

  // Open at the learner's frontier (DESIGN §7).
  useEffect(() => {
    frontierRef.current?.scrollIntoView({
      block: 'center',
      inline: 'center',
      behavior: motion === 'full' ? 'smooth' : 'auto',
    });
  }, [motion]);

  const modules = Object.values(manifest.modules);

  return (
    <div className={styles.viewport} ref={containerRef}>
      <div className={styles.canvas} style={{ inlineSize: width, blockSize: height }}>
        {manifest.tracks.map((track) => {
          const lane = lanes[track.id];
          if (!lane) return null;
          return (
            <div
              key={track.id}
              className={styles.lane}
              style={{
                insetInlineStart: lane.x - OVERVIEW.laneGap / 2,
                inlineSize: lane.width + OVERVIEW.laneGap,
                ['--track' as string]: `var(--${track.color})`,
              }}
            >
              <h2 className={styles.laneTitle}>{track.title}</h2>
            </div>
          );
        })}

        <svg className={styles.edges} width={width} height={height} aria-hidden="true">
          {modules.flatMap((module) => [
            ...module.dependsOn.map((dep) => {
              const from = manifest.modules[dep];
              if (!from) return null;
              const sameTrack = from.track === module.track;
              return (
                <path
                  key={`${dep}->${module.id}`}
                  d={edgePath(from.position, module.position)}
                  className={sameTrack ? styles.edge : styles.crossEdge}
                />
              );
            }),
            ...module.recommendsModules.map((rec) => {
              const from = manifest.modules[rec];
              if (!from) return null;
              return (
                <path
                  key={`${rec}~>${module.id}`}
                  d={edgePath(from.position, module.position)}
                  className={styles.recommendEdge}
                />
              );
            }),
          ])}
        </svg>

        <ul className={styles.modules}>
          {modules.map((module) => {
            const summary = summarizeModule(module, manifest, statuses, tier);
            const track = manifest.tracks.find((t) => t.id === module.track);
            const isFrontier = module.id === frontierModule;
            return (
              <li
                key={module.id}
                className={styles.moduleItem}
                style={{
                  insetInlineStart: module.position.x - MODULE_CARD.width / 2,
                  insetBlockStart: module.position.y - MODULE_CARD.height / 2,
                  inlineSize: MODULE_CARD.width,
                  blockSize: MODULE_CARD.height,
                  ['--track' as string]: `var(--${track?.color ?? 'text-2'})`,
                }}
              >
                <Link
                  to={{ pathname: `/map/${module.id}`, search }}
                  ref={isFrontier ? frontierRef : undefined}
                  className={styles.module}
                  data-state={summary.state}
                  data-frontier={isFrontier || undefined}
                  data-nav
                >
                  <span className={styles.moduleTitle}>
                    {module.boss && <Swords aria-hidden="true" className={styles.boss} />}
                    {module.title}
                  </span>
                  <span className={styles.moduleMeta}>
                    <ProgressRing
                      value={summary.completed}
                      max={Math.max(1, summary.published)}
                      size={22}
                      label={`${summary.completed} of ${summary.published} playable lessons completed`}
                      colorToken="--success"
                    />
                    <span>
                      {MODULE_STATE_LABEL[summary.state]} · {summary.completed}/{summary.total}
                      <span className="visually-hidden"> lessons completed</span>
                    </span>
                  </span>
                  {isFrontier && <span className={styles.here}>You are here</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
