import { Star, Swords } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { InlineCode } from '../../components/InlineCode.tsx';
import { manifest } from '../../engine/content/manifest.ts';
import { LESSON_NODE } from '../../engine/skilltree/layout-constants.ts';
import { STATE_LABELS, visibleInFilter, type TierFilter } from '../../engine/skilltree/summary.ts';
import type { SkillModule, SkillNode } from '../../engine/skilltree/types.ts';
import type { NodeState, NodeStatus } from '../../engine/skilltree/unlock.ts';
import { cx } from '../../components/cx.ts';
import { LessonPreviewCard } from './LessonPreviewCard.tsx';
import styles from './ModuleView.module.css';
import { StateIcon } from './StateIcon.tsx';
import { useArrowNavigation } from './use-arrow-navigation.ts';
import { useCompletionPulse } from './use-completion-pulse.ts';

interface ModuleViewProps {
  module: SkillModule;
  tier: TierFilter;
  statuses: Record<string, NodeStatus>;
}

function edgePath(from: SkillNode, to: SkillNode) {
  const y1 = from.position.y + LESSON_NODE[from.tier].height / 2;
  const y2 = to.position.y - LESSON_NODE[to.tier].height / 2;
  const bend = Math.max(16, (y2 - y1) / 2);
  return `M ${from.position.x} ${y1} C ${from.position.x} ${y1 + bend}, ${to.position.x} ${y2 - bend}, ${to.position.x} ${y2}`;
}

function NodeLabel({ node, state }: { node: SkillNode; state: NodeState }) {
  return (
    <>
      <span className={styles.nodeTitle}>
        {node.boss && <Swords aria-hidden="true" className={styles.boss} />}
        <InlineCode text={node.title} />
      </span>
      <span className={styles.nodeMeta}>
        <StateIcon state={state} className={styles.stateIcon} />
        {STATE_LABELS[state]} · {node.minutes} min
        {node.tier === 'extended' && <span className="visually-hidden">, depth lesson</span>}
      </span>
    </>
  );
}

/** Module zoom: lessons laid out at build time, with prerequisite edges between them. */
export function ModuleView({ module, tier, statuses }: ModuleViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  useArrowNavigation(containerRef);
  const pulse = useCompletionPulse(module.lessons, statuses);
  const nodes = module.lessons
    .map((id) => manifest.nodes[id])
    .filter((n): n is SkillNode => n !== undefined && visibleInFilter(n, tier));
  const visible = new Set(nodes.map((n) => n.id));
  const externalRequires = [
    ...new Set(nodes.flatMap((n) => n.requires).filter((id) => !module.lessons.includes(id))),
  ];

  useEffect(() => {
    containerRef.current
      ?.querySelector<HTMLElement>('[data-state="available"], [data-state="in-progress"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);

  const selectedNode = selected ? manifest.nodes[selected] : undefined;
  const selectedStatus = selected ? statuses[selected] : undefined;

  return (
    <div className={styles.wrapper}>
      {externalRequires.length > 0 && (
        <p className={styles.entry}>
          Builds on:{' '}
          {externalRequires.map((id, i) => (
            <span key={id}>
              {i > 0 && ', '}
              <InlineCode text={manifest.nodes[id]?.title ?? id} />
            </span>
          ))}
        </p>
      )}
      <div className={styles.viewport} ref={containerRef}>
        <div
          className={styles.canvas}
          style={{ inlineSize: module.size.width, blockSize: module.size.height }}
        >
          <svg
            className={styles.edges}
            width={module.size.width}
            height={module.size.height}
            aria-hidden="true"
          >
            {nodes.flatMap((node) => [
              ...node.requires
                .filter((id) => visible.has(id))
                .map((id) => {
                  const from = manifest.nodes[id];
                  return from ? (
                    <path
                      key={`${id}->${node.id}`}
                      d={edgePath(from, node)}
                      className={styles.edge}
                    />
                  ) : null;
                }),
              ...node.related
                .filter((id) => visible.has(id))
                .map((id) => {
                  const from = manifest.nodes[id];
                  return from ? (
                    <path
                      key={`${id}~${node.id}`}
                      d={edgePath(from, node)}
                      className={styles.related}
                    />
                  ) : null;
                }),
            ])}
          </svg>
          <ol className={styles.nodes}>
            {nodes.map((node) => {
              const status = statuses[node.id];
              const state = status?.state ?? 'planned';
              const size = LESSON_NODE[node.tier];
              const track = manifest.tracks.find((t) => t.id === node.track);
              const common = {
                className: cx(styles.node, styles[node.tier], node.boss && styles.bossNode),
                'data-state': state,
                'data-pulse': pulse.has(node.id) || undefined,
              };
              return (
                <li
                  key={node.id}
                  className={styles.item}
                  style={{
                    insetInlineStart: node.position.x - size.width / 2,
                    insetBlockStart: node.position.y - size.height / 2,
                    inlineSize: size.width,
                    blockSize: size.height,
                    ['--track' as string]: `var(--${track?.color ?? 'text-2'})`,
                  }}
                >
                  {state === 'planned' ? (
                    // Planned lessons are shown but not interactive (DESIGN §6).
                    <div {...common}>
                      <NodeLabel node={node} state={state} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      {...common}
                      data-nav
                      onClick={() => setSelected(node.id)}
                      aria-haspopup="dialog"
                    >
                      <NodeLabel node={node} state={state} />
                      {status?.recommendationPending && (
                        <span className={styles.recommended}>
                          <Star aria-hidden="true" />
                          <span className="visually-hidden">Recommended lesson first</span>
                        </span>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      {selectedNode && selectedStatus && (
        <LessonPreviewCard
          node={selectedNode}
          status={selectedStatus}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
