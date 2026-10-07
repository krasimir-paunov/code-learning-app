import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { AutoGridLabProps } from './build.ts';
import { autoTracks, type Repeat } from './model.ts';
import styles from './View.module.css';
import { useElementWidth } from '../../components/use-element-width.ts';

const round = (n: number) => Math.round(n * 10) / 10;

const STAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  .wrap { padding: 12px; background: #eef1f5; font: 600 14px/1.2 system-ui, sans-serif; }
  .area { position: relative; }
  .grid { display: grid; position: relative; z-index: 1; }
  .item { display: grid; place-items: center; min-height: 56px; border-radius: 4px; background: #1d4ed8; color: #fff; }
  .item.wide { background: #7c3aed; }
  .ghosts { position: absolute; inset: 0; display: grid; }
  .ghost { border: 2px dashed #94a3b8; border-radius: 4px; }
  .ghost[data-collapsed] { border-color: #dc2626; border-width: 0 0 0 3px; border-style: solid; }
`;

export default function AutoGridLabView({ props }: VisualizerViewProps<AutoGridLabProps>) {
  const id = useId();
  const [mode, setMode] = useState<Repeat>('auto-fill');
  const [min, setMin] = useState(String(props.mins[0] ?? 150));
  const [items, setItems] = useState(props.items);
  const [width, setWidth] = useState(props.width.start);
  const [flow, setFlow] = useState<'row' | 'row dense'>('row');
  const [resolved, setResolved] = useState<number[]>([]);
  const [areaRef, available] = useElementWidth();

  const max = Math.max(
    props.width.min,
    Math.min(props.width.max, (available ?? props.width.max) - 30),
  );
  const shown = Math.min(width, max);
  const minPx = Number(min);
  const columns = `repeat(${mode}, minmax(${minPx}px, 1fr))`;
  const predicted = autoTracks(mode, shown, minPx, props.gap, items);

  const html = `<div class="wrap"><div class="area"><div class="ghosts">${resolved
    .map((size) => `<div class="ghost"${size === 0 ? ' data-collapsed' : ''}></div>`)
    .join(
      '',
    )}</div><div class="grid">${Array.from({ length: items }, (_, i) => `<div class="item">${i + 1}</div>`).join('')}</div></div></div>`;
  const css = `${STAGE_CSS}
    .grid, .ghosts { width: ${shown}px; grid-template-columns: ${columns}; gap: ${props.gap}px; }
    .ghosts { grid-template-columns: ${resolved.map((s) => `${s}px`).join(' ') || 'none'}; }`;

  const filled = predicted.sizes.filter((s) => s > 0).length;
  const empty = predicted.count - Math.min(items, predicted.count);

  const denseHtml = `<div class="wrap"><div class="grid dense">${props.dense.items
    .map(
      (label) =>
        `<div class="item${props.dense.wide.includes(label) ? ' wide' : ''}">${label}</div>`,
    )
    .join('')}</div></div>`;
  const denseCss = `${STAGE_CSS}
    .dense { grid-template-columns: repeat(3, 1fr); grid-auto-flow: ${flow}; gap: 8px; }
    .wide { grid-column: span 2; }`;

  return (
    <div className={styles.frame}>
      <section className={styles.panel} aria-labelledby={`${id}-fit`}>
        <h3 id={`${id}-fit`} className={styles.title}>
          As many columns as fit
        </h3>
        <div className={styles.controls}>
          <SegmentedControl<Repeat>
            label="repeat()"
            size="sm"
            options={[
              { value: 'auto-fill', label: 'auto-fill' },
              { value: 'auto-fit', label: 'auto-fit' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <SegmentedControl
            label="minimum column width"
            size="sm"
            options={props.mins.map((m) => ({ value: String(m), label: `${m}px` }))}
            value={min}
            onChange={setMin}
          />
          <div className={styles.stepper} role="group" aria-label="Items">
            <span className={styles.stepLabel}>Items</span>
            <button
              type="button"
              aria-label="Fewer items"
              disabled={items <= 1}
              onClick={() => setItems((n) => n - 1)}
            >
              <Minus aria-hidden="true" />
            </button>
            <output aria-live="polite">{items}</output>
            <button
              type="button"
              aria-label="More items"
              disabled={items >= 10}
              onClick={() => setItems((n) => n + 1)}
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
        </div>
        <Slider
          label="Container width"
          min={props.width.min}
          max={max}
          step={10}
          value={shown}
          onChange={setWidth}
          format={(v) => `${v}px`}
        />
        <div ref={areaRef} className={styles.area}>
          <ShadowStage
            html={html}
            css={css}
            className={styles.stage}
            inert
            onRender={(root) => {
              const grid = root.querySelector('.grid');
              if (!grid) return;
              const next = getComputedStyle(grid)
                .gridTemplateColumns.split(' ')
                .map((v) => Number.parseFloat(v))
                .filter((n) => !Number.isNaN(n));
              setResolved((r) => (r.join() === next.join() ? r : next));
            }}
          />
        </div>
        <p className={styles.readout} aria-live="polite">
          <code>grid-template-columns: {columns}</code> → {predicted.count}{' '}
          {predicted.count === 1 ? 'column fits' : 'columns fit'} at {minPx}px.{' '}
          {empty > 0 &&
            mode === 'auto-fill' &&
            `auto-fill keeps ${empty} empty, so the items stay ${round(predicted.sizes[0] ?? 0)}px wide.`}
          {empty > 0 &&
            mode === 'auto-fit' &&
            `auto-fit collapses the ${empty} empty ${empty === 1 ? 'one' : 'ones'}, so the ${filled} items stretch to ${round(predicted.sizes[0] ?? 0)}px.`}
          {empty === 0 && 'Every column holds an item, so auto-fill and auto-fit look the same.'}
          <span className={styles.browser}>
            {' '}
            Browser: {resolved.map((s) => `${round(s)}px`).join(' ')}
          </span>
        </p>
      </section>

      <section className={styles.panel} aria-labelledby={`${id}-dense`}>
        <h3 id={`${id}-dense`} className={styles.title}>
          Filling the holes
        </h3>
        <SegmentedControl<'row' | 'row dense'>
          label="grid-auto-flow"
          size="sm"
          options={[
            { value: 'row', label: 'row' },
            { value: 'row dense', label: 'row dense' },
          ]}
          value={flow}
          onChange={setFlow}
        />
        <ShadowStage html={denseHtml} css={denseCss} className={styles.stage} inert />
        <p className={styles.readout}>
          Purple items span two columns. Without <code>dense</code>, a hole stays wherever a wide
          item didn’t fit; with it, later items move back to fill holes, so the order on screen no
          longer matches the HTML.
        </p>
      </section>
    </div>
  );
}
