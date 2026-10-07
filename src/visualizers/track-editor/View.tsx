import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { TrackEditorProps } from './build.ts';
import { frMath, linePositions, parseTrack } from './model.ts';
import styles from './View.module.css';

const round = (n: number) => Math.round(n * 10) / 10;

/** The element's content width, kept current with a ResizeObserver (attached by a callback ref). */
function useWidth() {
  const [width, setWidth] = useState<number | null>(null);
  const ref = (element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  };
  return [ref, width] as const;
}

const STAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  .wrap { padding: 28px 12px; background: #eef1f5; font: 14px/1.3 system-ui, sans-serif; }
  .area { position: relative; }
  .grid { display: grid; }
  .item { padding: 10px; border-radius: 4px; background: #1d4ed8; color: #fff; font-weight: 600; }
  .line { position: absolute; top: -6px; bottom: -6px; width: 0; border-left: 2px dashed #c2410c; }
  .line span { position: absolute; left: -12px; width: 24px; text-align: center; color: #9a3412; font: 700 12px ui-monospace, monospace; }
  .line .pos { top: -18px; }
  .line .neg { bottom: -18px; }
`;

export default function TrackEditorView({ props }: VisualizerViewProps<TrackEditorProps>) {
  const [tracks, setTracks] = useState<string[]>(props.tracks);
  const [gap, setGap] = useState(String(props.gap));
  const [width, setWidth] = useState(props.width.start);
  const [resolved, setResolved] = useState<number[]>([]);
  const [areaRef, available] = useWidth();

  // Never wider than the space on screen (minus the stage's padding), so the page never scrolls sideways.
  const max = Math.max(
    props.width.min,
    Math.min(props.width.max, (available ?? props.width.max) - 26),
  );
  const shown = Math.min(width, max);
  const valid = tracks.map((t) => CSS.supports('grid-template-columns', t));
  const usable = tracks.filter((_, i) => valid[i]);
  const columns = usable.join(' ') || 'none';
  const gapPx = Number(gap);

  const lines = linePositions(resolved, gapPx);
  const html = `<div class="wrap"><div class="area"><div class="grid">${Array.from(
    { length: props.items },
    (_, i) => `<div class="item">${i + 1}</div>`,
  ).join('')}</div>${lines
    .map(
      (x, i) =>
        `<div class="line" style="left:${x}px"><span class="pos">${i + 1}</span><span class="neg">${i - lines.length}</span></div>`,
    )
    .join('')}</div></div>`;
  const css = `${STAGE_CSS}\n.grid { width: ${shown}px; grid-template-columns: ${columns}; gap: ${gapPx}px; }`;

  const math = frMath(usable.map(parseTrack), shown, gapPx);
  const exact = math.sizes.every((s) => s !== null);

  return (
    <div className={styles.frame}>
      <div className={styles.tracks} role="group" aria-label="grid-template-columns">
        <code className={styles.prop}>grid-template-columns:</code>
        {tracks.map((track, i) => (
          <span key={i} className={styles.chip} data-invalid={!valid[i] || undefined}>
            <input
              className={styles.chipInput}
              value={track}
              size={Math.max(4, track.length)}
              spellCheck={false}
              aria-label={`Track ${i + 1}`}
              aria-invalid={!valid[i] || undefined}
              onChange={(e) =>
                setTracks((all) => all.map((t, j) => (j === i ? e.target.value : t)))
              }
            />
            <button
              type="button"
              className={styles.remove}
              aria-label={`Remove track ${i + 1}`}
              disabled={tracks.length === 1}
              onClick={() => setTracks((all) => all.filter((_, j) => j !== i))}
            >
              <X aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div className={styles.presets} role="group" aria-label="Add a track">
        {props.presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={styles.add}
            disabled={tracks.length >= 6}
            onClick={() => setTracks((all) => [...all, preset])}
          >
            <Plus aria-hidden="true" /> <code>{preset}</code>
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <SegmentedControl
          label="gap"
          size="sm"
          options={['0', '12', '24'].map((v) => ({ value: v, label: `${v}px` }))}
          value={gap}
          onChange={setGap}
        />
        <Slider
          label="Container width"
          min={props.width.min}
          max={max}
          step={10}
          value={shown}
          onChange={setWidth}
          format={(v) => `${v}px`}
        />
      </div>

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

      <div className={styles.readout} aria-live="polite">
        <p>
          The browser resolved the tracks to{' '}
          <code>{resolved.map((n) => `${round(n)}px`).join(' ') || '…'}</code>.
        </p>
        {math.totalFr > 0 && exact && (
          <p>
            {shown}px − {math.fixed}px fixed − {math.gaps}px of gaps ={' '}
            <strong>{round(math.free)}px free</strong>, shared over {math.totalFr}fr:{' '}
            <strong>1fr = {round(math.perFr)}px</strong>.
          </p>
        )}
        {math.totalFr > 0 && !exact && (
          <p>Content-sized tracks are sized first; the fr tracks share what is left.</p>
        )}
      </div>
    </div>
  );
}
