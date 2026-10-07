import { useId, useState, type PointerEvent } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { TypeLabProps } from './build.ts';
import {
  fontSizeAt,
  followsTextSize,
  parseFontSize,
  type FontSizeSpec,
  type Phase,
} from './model.ts';
import styles from './View.module.css';

const MIN_VW = 320;
const MAX_VW = 1600;
const W = 600;
const H = 220;
const PAD = { left: 40, right: 12, top: 12, bottom: 28 };

const PHASE_TEXT: Record<Phase, string> = {
  fixed: 'the same at every width',
  fluid: 'growing with the viewport',
  min: 'held at the minimum',
  max: 'held at the maximum',
};

const round = (n: number) => Math.round(n * 10) / 10;

interface Run {
  phase: Phase;
  points: string[];
}

/** Samples the size across viewports and splits the line where the clamp phase changes. */
function plot(spec: FontSizeSpec, root: number, yMax: number): Run[] {
  const x = (vw: number) =>
    PAD.left + ((vw - MIN_VW) / (MAX_VW - MIN_VW)) * (W - PAD.left - PAD.right);
  const y = (px: number) => H - PAD.bottom - (px / yMax) * (H - PAD.top - PAD.bottom);
  const runs: Run[] = [];
  for (let vw = MIN_VW; vw <= MAX_VW; vw += 8) {
    const { px, phase } = fontSizeAt(spec, { root, viewport: vw });
    const point = `${round(x(vw))},${round(y(px))}`;
    const last = runs.at(-1);
    if (last?.phase === phase) last.points.push(point);
    else runs.push({ phase, points: last ? [last.points.at(-1) ?? point, point] : [point] });
  }
  return runs;
}

export default function TypeLabView({ props }: VisualizerViewProps<TypeLabProps>) {
  const id = useId();
  const [text, setText] = useState(props.presets[0] ?? '');
  const [spec, setSpec] = useState<FontSizeSpec | null>(() =>
    parseFontSize(props.presets[0] ?? ''),
  );
  const [viewport, setViewport] = useState(props.viewport);
  const [root, setRoot] = useState('16');
  const [lineHeight, setLineHeight] = useState(props.lineHeights[0] ?? 'normal');
  const [lines, setLines] = useState('');

  const rootPx = Number(root);
  const edit = (value: string) => {
    setText(value);
    const parsed = parseFontSize(value);
    if (parsed) setSpec(parsed);
  };
  const invalid = parseFontSize(text) === null;

  const current = spec ? fontSizeAt(spec, { root: rootPx, viewport }) : null;
  const yMax =
    spec === null
      ? 64
      : Math.max(
          40,
          ...[MIN_VW, MAX_VW].map((vw) => fontSizeAt(spec, { root: 32, viewport: vw }).px * 1.1),
        );
  const runs = spec ? plot(spec, rootPx, yMax) : [];
  const markerX = PAD.left + ((viewport - MIN_VW) / (MAX_VW - MIN_VW)) * (W - PAD.left - PAD.right);
  const markerY = current ? H - PAD.bottom - (current.px / yMax) * (H - PAD.top - PAD.bottom) : 0;

  const scrub = (e: PointerEvent<SVGSVGElement>) => {
    if (e.type === 'pointermove' && e.buttons !== 1) return;
    const box = e.currentTarget.getBoundingClientRect();
    const fraction = ((e.clientX - box.left) / box.width) * W;
    const vw = MIN_VW + ((fraction - PAD.left) / (W - PAD.left - PAD.right)) * (MAX_VW - MIN_VW);
    setViewport(Math.round(Math.min(MAX_VW, Math.max(MIN_VW, vw)) / 10) * 10);
  };

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby={`${id}-fluid`}>
          <h3 id={`${id}-fluid`} className={styles.title}>
            Font size across screen widths
          </h3>
          <label className={styles.field}>
            <code className={styles.prop}>font-size:</code>
            <input
              className={styles.input}
              value={text}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={invalid || undefined}
              onChange={(e) => edit(e.target.value)}
            />
          </label>
          {invalid && (
            <p className={styles.error}>
              Use px, rem and vw terms, optionally inside <code>clamp(min, preferred, max)</code>.
            </p>
          )}
          <div className={styles.presets} role="group" aria-label="Try">
            {props.presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={styles.preset}
                aria-pressed={text === preset}
                onClick={() => edit(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <svg
            className={styles.chart}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Graph of font-size from ${MIN_VW} to ${MAX_VW}px wide screens`}
            onPointerDown={scrub}
            onPointerMove={scrub}
          >
            <line
              className={styles.axis}
              x1={PAD.left}
              y1={H - PAD.bottom}
              x2={W - PAD.right}
              y2={H - PAD.bottom}
            />
            <line
              className={styles.axis}
              x1={PAD.left}
              y1={PAD.top}
              x2={PAD.left}
              y2={H - PAD.bottom}
            />
            {[MIN_VW, 768, 1280, MAX_VW].map((vw) => {
              const x = PAD.left + ((vw - MIN_VW) / (MAX_VW - MIN_VW)) * (W - PAD.left - PAD.right);
              return (
                <text key={vw} className={styles.tick} x={x} y={H - 8} textAnchor="middle">
                  {vw}
                </text>
              );
            })}
            <text className={styles.tick} x={PAD.left - 6} y={PAD.top + 10} textAnchor="end">
              {Math.round(yMax)}
            </text>
            <text className={styles.tick} x={PAD.left - 6} y={H - PAD.bottom} textAnchor="end">
              0
            </text>
            {runs.map((run, i) => (
              <polyline
                key={i}
                className={styles.line}
                data-phase={run.phase}
                points={run.points.join(' ')}
              />
            ))}
            <line
              className={styles.marker}
              x1={markerX}
              y1={PAD.top}
              x2={markerX}
              y2={H - PAD.bottom}
            />
            {current && <circle className={styles.dot} cx={markerX} cy={markerY} r={6} />}
          </svg>
          <p className={styles.legend}>Solid: growing with the screen. Dashed: held by clamp().</p>

          <Slider
            label="Viewport width"
            min={MIN_VW}
            max={MAX_VW}
            step={10}
            value={viewport}
            onChange={setViewport}
            format={(v) => `${v}px`}
          />
          <SegmentedControl
            label="Browser text size"
            size="sm"
            options={[
              { value: '16', label: '16px (default)' },
              { value: '24', label: '24px (larger)' },
            ]}
            value={root}
            onChange={setRoot}
          />

          {current && spec && (
            <div className={styles.result} aria-live="polite">
              <p>
                At {viewport}px: <strong>{round(current.px)}px</strong>, {PHASE_TEXT[current.phase]}
                .
              </p>
              <p>
                Follows the browser’s text size:{' '}
                <strong>{followsTextSize(spec, { root: rootPx, viewport })}</strong>.
              </p>
            </div>
          )}
          <p
            className={styles.preview}
            style={{ fontSize: current ? `${current.px}px` : undefined }}
          >
            {props.heading}
          </p>
        </section>

        <section className={styles.panel} aria-labelledby={`${id}-leading`}>
          <h3 id={`${id}-leading`} className={styles.title}>
            Line height on the article
          </h3>
          <SegmentedControl
            label="line-height"
            size="sm"
            options={props.lineHeights.map((v) => ({ value: v, label: v }))}
            value={lineHeight}
            onChange={setLineHeight}
          />
          <ShadowStage
            html={props.article}
            css={`
              article {
                font-size: 16px;
                line-height: ${lineHeight};
              }
              h2 {
                font-size: 32px;
                margin: 0 0 8px;
              }
              p {
                margin: 0;
              }
            `}
            className={styles.stage}
            inert
            onRender={(root) => {
              const h2 = root.querySelector('h2');
              const p = root.querySelector('p');
              if (!h2 || !p) return;
              const next = `Heading: 32px text on ${getComputedStyle(h2).lineHeight} lines. Paragraph: 16px text on ${getComputedStyle(p).lineHeight} lines.`;
              setLines((l) => (l === next ? l : next));
            }}
          />
          <p className={styles.result} aria-live="polite">
            {lines}
          </p>
        </section>
      </div>
    </div>
  );
}
