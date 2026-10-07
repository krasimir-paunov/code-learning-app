import { Layers } from 'lucide-react';
import { useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { StackLayersProps } from './build.ts';
import { layerTree, onTop, paintOrder, type Box, type LayerGroup } from './model.ts';
import styles from './View.module.css';

const Z_CHOICES = ['auto', '-1', '0', '1', '10', '20', '30', '9999'] as const;
const TRIGGER_CSS = {
  opacity: 'opacity: 0.99',
  transform: 'transform: translateZ(0)',
  isolate: 'isolation: isolate',
};

const PAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  .page { padding: 16px; background: #eef1f5; font: 14px/1.4 system-ui, sans-serif; }
`;

interface RowProps {
  group: LayerGroup | { id: string };
  boxes: readonly Box[];
  label: (id: string) => string;
  highlight: readonly string[];
}

/** One context: its own row, then its members top first, nested contexts as sub-lists. */
function LayerRow({ group, boxes, label, highlight }: RowProps) {
  const isContext = 'members' in group;
  const box = boxes.find((x) => x.id === group.id);
  return (
    <li className={styles.item}>
      <span
        className={styles.layer}
        data-context={isContext || undefined}
        data-compare={highlight.includes(group.id) || undefined}
      >
        <span className={styles.name}>{label(group.id)}</span>
        <code className={styles.z}>z {box?.z}</code>
        {isContext && <span className={styles.badge}>stacking context</span>}
      </span>
      {isContext && group.members.length > 0 && (
        <ol className={styles.layers}>
          {group.members.map((member) => (
            <LayerRow
              key={member.id}
              group={member}
              boxes={boxes}
              label={label}
              highlight={highlight}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

export default function StackLayersView({ props }: VisualizerViewProps<StackLayersProps>) {
  const [zs, setZs] = useState<Record<string, number | 'auto'>>(() =>
    Object.fromEntries(props.boxes.map((b) => [b.id, b.z])),
  );
  const [on, setOn] = useState<Set<number>>(() => new Set());

  const boxes: Box[] = props.boxes.map((b) => ({
    id: b.id,
    parent: b.parent,
    position: b.position,
    z: zs[b.id] ?? b.z,
    ...Object.fromEntries(
      props.triggers
        .filter((t, i) => t.box === b.id && on.has(i))
        .map((t) => (t.kind === 'opacity' ? ['opacity', 0.99] : [t.kind, true])),
    ),
  }));
  const label = (id: string) => props.boxes.find((b) => b.id === id)?.label ?? id;
  const tree = layerTree(boxes);

  const [a, b] = props.compare;
  const winner = onTop(boxes, a, b);
  const loser = winner === a ? b : a;
  // When the loser has the bigger z-index, name the context that traps it.
  const order = paintOrder(boxes);
  const trapContext = order.find((l) => l.id === loser)?.contexts.at(-1);
  const zOf = (id: string) => {
    const z = boxes.find((x) => x.id === id)?.z;
    return typeof z === 'number' ? z : 0;
  };
  const trapped =
    zOf(loser) > zOf(winner) &&
    trapContext &&
    order.find((l) => l.id === winner)?.contexts.at(-1) !== trapContext
      ? ` ${label(loser)}'s z-index of ${zOf(loser)} only competes inside ${label(trapContext)}, and that whole context is painted below ${label(winner)}.`
      : '';

  const css = [
    PAGE_CSS,
    props.css,
    ...boxes.map((box) => `#${box.id} { z-index: ${box.z}; }`),
    ...props.triggers.flatMap((t, i) =>
      on.has(i) ? [`#${t.box} { ${TRIGGER_CSS[t.kind]}; }`] : [],
    ),
  ].join('\n');

  return (
    <div className={styles.frame}>
      <div className={styles.controls}>
        {props.boxes
          .filter((box) => box.editable)
          .map((box) => (
            <label key={box.id} className={styles.zField}>
              <span>
                <strong>{box.label}</strong> <code>z-index</code>
              </span>
              <select
                value={String(zs[box.id])}
                onChange={(e) =>
                  setZs((s) => ({
                    ...s,
                    [box.id]: e.target.value === 'auto' ? 'auto' : Number(e.target.value),
                  }))
                }
              >
                {Z_CHOICES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          ))}
        {props.triggers.map((t, i) => (
          <label key={`${t.box}-${t.kind}`} className={styles.check}>
            <input
              type="checkbox"
              checked={on.has(i)}
              onChange={(e) =>
                setOn((s) => {
                  const next = new Set(s);
                  if (e.target.checked) next.add(i);
                  else next.delete(i);
                  return next;
                })
              }
            />
            <code>
              {label(t.box)}: {TRIGGER_CSS[t.kind]}
            </code>
          </label>
        ))}
      </div>

      <div className={styles.layout}>
        <ShadowStage
          html={`<div class="page">${props.html}</div>`}
          css={css}
          className={styles.stage}
          inert
        />
        <section className={styles.panel} aria-label="Layers, top first">
          <h3 className={styles.title}>
            <Layers aria-hidden="true" /> Layers, top first
          </h3>
          {tree && (
            <ol className={styles.layers}>
              <LayerRow group={tree} boxes={boxes} label={label} highlight={props.compare} />
            </ol>
          )}
          <p className={styles.result} aria-live="polite">
            Where they overlap, <strong>{label(winner)}</strong> is on top.{trapped}
          </p>
        </section>
      </div>
    </div>
  );
}
