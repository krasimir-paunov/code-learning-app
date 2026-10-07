import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import type { LoadWaterfallProps } from './build.ts';
import { simulate, type Kind, type Resource } from './model.ts';
import styles from './View.module.css';

const SCRIPT_KINDS: readonly Kind[] = ['script', 'defer', 'async', 'module'];

function tagFor(r: Resource): string {
  if (r.kind === 'css') return `<link rel="stylesheet" href="${r.id}">`;
  if (r.kind === 'script') return `<script src="${r.id}"></script>`;
  if (r.kind === 'module') return `<script type="module" src="${r.id}"></script>`;
  return `<script ${r.kind} src="${r.id}"></script>`;
}

export default function LoadWaterfallView({ props }: VisualizerViewProps<LoadWaterfallProps>) {
  const [head, setHead] = useState<Resource[]>(props.resources);
  const t = simulate(head, props.body);
  const end = Math.max(t.load, t.parseEnd) * 1.05;
  const pct = (ms: number) => `${(ms / end) * 100}%`;

  const move = (index: number, by: number) =>
    setHead((all) => {
      const next = [...all];
      const [item] = next.splice(index, 1);
      if (item) next.splice(index + by, 0, item);
      return next;
    });

  const markers = [
    { label: 'First paint', at: t.firstPaint, key: 'paint' },
    { label: 'DOMContentLoaded', at: t.domContentLoaded, key: 'dcl' },
  ];

  return (
    <div className={styles.frame}>
      <ol className={styles.head} aria-label="The page's head, in order">
        {head.map((r, i) => (
          <li key={r.id} className={styles.row}>
            <code className={styles.tag}>{tagFor(r)}</code>
            {r.kind !== 'css' && (
              <select
                className={styles.select}
                aria-label={`How ${r.id} loads`}
                value={r.kind}
                onChange={(e) =>
                  setHead((all) =>
                    all.map((x) => (x.id === r.id ? { ...x, kind: e.target.value as Kind } : x)),
                  )
                }
              >
                {SCRIPT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k === 'script' ? 'classic' : k}
                  </option>
                ))}
              </select>
            )}
            <span className={styles.moves}>
              <button
                type="button"
                aria-label={`Move ${r.id} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Move ${r.id} down`}
                disabled={i === head.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown aria-hidden="true" />
              </button>
            </span>
          </li>
        ))}
      </ol>

      <figure className={styles.chart} aria-label="Load timeline">
        <div className={styles.lanes}>
          <div className={styles.lane}>
            <span className={styles.laneLabel}>HTML parser</span>
            <span className={styles.track}>
              <span
                className={styles.parse}
                style={{ insetInlineStart: 0, inlineSize: pct(t.parseEnd) }}
              />
              {t.blocked.map(([from, to], i) => (
                <span
                  key={i}
                  className={styles.blocked}
                  style={{ insetInlineStart: pct(from), inlineSize: pct(to - from) }}
                  title={`Stopped from ${from} to ${to} ms`}
                />
              ))}
            </span>
          </div>
          {t.resources.map((r) => (
            <div key={r.id} className={styles.lane}>
              <span className={styles.laneLabel}>{r.id}</span>
              <span className={styles.track}>
                <span
                  className={styles.download}
                  data-kind={r.kind}
                  style={{ insetInlineStart: pct(r.start), inlineSize: pct(r.loaded - r.start) }}
                />
                {r.ran && (
                  <span
                    className={styles.run}
                    style={{
                      insetInlineStart: pct(r.ran[0]),
                      inlineSize: `max(4px, ${pct(r.ran[1] - r.ran[0])})`,
                    }}
                  />
                )}
              </span>
            </div>
          ))}
          <div className={styles.markers} aria-hidden="true">
            {markers.map((m) => (
              <span
                key={m.key}
                className={styles.marker}
                data-marker={m.key}
                style={{ insetInlineStart: pct(m.at) }}
              />
            ))}
          </div>
        </div>
        <figcaption className={styles.legend}>
          <span data-legend="download">downloading</span>
          <span data-legend="run">running</span>
          <span data-legend="blocked">parser stopped</span>
          <span data-legend="paint">first paint</span>
          <span data-legend="dcl">DOMContentLoaded</span>
        </figcaption>
      </figure>

      <dl className={styles.summary} aria-live="polite">
        <div>
          <dt>First paint</dt>
          <dd>{Math.round(t.firstPaint)} ms</dd>
        </div>
        <div>
          <dt>DOMContentLoaded</dt>
          <dd>{Math.round(t.domContentLoaded)} ms</dd>
        </div>
        <div>
          <dt>Parser stopped for</dt>
          <dd>{Math.round(t.blocked.reduce((sum, [a, b]) => sum + b - a, 0))} ms</dd>
        </div>
        <div>
          <dt>Scripts ran in this order</dt>
          <dd>{t.order.join(' → ') || 'none'}</dd>
        </div>
      </dl>
      <p className={styles.note}>
        A simplified timeline: real browsers overlap more work, but the order of events follows
        these rules.
      </p>
    </div>
  );
}
