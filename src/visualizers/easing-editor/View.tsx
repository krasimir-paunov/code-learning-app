import { Play } from 'lucide-react';
import { useRef, useState, type PointerEvent } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { useMotionPreference } from '../../effects/motion.ts';
import type { VisualizerViewProps } from '../contract.ts';
import type { EasingEditorProps } from './build.ts';
import { filmstrip, PRESETS, presetName, toCss, type Curve } from './model.ts';
import styles from './View.module.css';

/** The graph spans progress from -0.5 to 1.5, so overshooting curves stay visible. */
const SIZE = 240;
const PAD = 16;
const toX = (x: number) => PAD + x * (SIZE - 2 * PAD);
const toY = (y: number) => PAD + (1.5 - y) * ((SIZE - 2 * PAD) / 2);
const fromPoint = (px: number, py: number): [number, number] => [
  Math.min(1, Math.max(0, (px - PAD) / (SIZE - 2 * PAD))),
  Math.min(1.5, Math.max(-0.5, 1.5 - ((py - PAD) * 2) / (SIZE - 2 * PAD))),
];
const round = (n: number) => Math.round(n * 100) / 100;

export default function EasingEditorView({ props }: VisualizerViewProps<EasingEditorProps>) {
  const [curve, setCurve] = useState<Curve>(PRESETS[props.start] ?? [0, 0, 1, 1]);
  const [duration, setDuration] = useState(String(props.durations[0] ?? 300));
  const [moved, setMoved] = useState(false);
  const dragging = useRef<0 | 1 | null>(null);
  // The app's own motion setting, which also follows the system preference.
  const reduced = useMotionPreference() !== 'full';
  const [x1, y1, x2, y2] = curve;
  const css = toCss(curve);
  const frames = filmstrip(curve);

  const set = (index: number, value: number) =>
    setCurve((c) => c.map((v, i) => (i === index ? value : v)) as Curve);

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current === null) return;
    const box = e.currentTarget.getBoundingClientRect();
    const [x, y] = fromPoint(
      ((e.clientX - box.left) / box.width) * SIZE,
      ((e.clientY - box.top) / box.height) * SIZE,
    );
    const base = dragging.current * 2;
    setCurve(
      (c) => c.map((v, i) => (i === base ? round(x) : i === base + 1 ? round(y) : v)) as Curve,
    );
  };

  const fields: [string, number, number, number][] = [
    ['x1', 0, 0, 1],
    ['y1', 1, -0.5, 1.5],
    ['x2', 2, 0, 1],
    ['y2', 3, -0.5, 1.5],
  ];

  return (
    <div className={styles.frame}>
      <div className={styles.presets} role="group" aria-label="Presets">
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            className={styles.preset}
            aria-pressed={presetName(curve) === name}
            onClick={() => setCurve(PRESETS[name] ?? curve)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <svg
          className={styles.graph}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragging.current = null)}
          onPointerLeave={() => (dragging.current = null)}
        >
          <rect
            className={styles.box}
            x={toX(0)}
            y={toY(1)}
            width={toX(1) - toX(0)}
            height={toY(0) - toY(1)}
          />
          <line className={styles.arm} x1={toX(0)} y1={toY(0)} x2={toX(x1)} y2={toY(y1)} />
          <line className={styles.arm} x1={toX(1)} y1={toY(1)} x2={toX(x2)} y2={toY(y2)} />
          <path
            className={styles.curve}
            d={`M${toX(0)},${toY(0)} C${toX(x1)},${toY(y1)} ${toX(x2)},${toY(y2)} ${toX(1)},${toY(1)}`}
          />
          {[0, 1].map((h) => (
            <circle
              key={h}
              className={styles.handle}
              cx={toX(curve[h * 2] ?? 0)}
              cy={toY(curve[h * 2 + 1] ?? 0)}
              r="9"
              onPointerDown={(e) => {
                e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId);
                dragging.current = h as 0 | 1;
              }}
            />
          ))}
          <text className={styles.axis} x={toX(1)} y={toY(0) + 14} textAnchor="end">
            time →
          </text>
          <text className={styles.axis} x={toX(0) + 4} y={toY(1) - 4}>
            progress
          </text>
        </svg>

        <div className={styles.side}>
          <fieldset className={styles.numbers}>
            <legend>Control points</legend>
            {fields.map(([name, index, min, max]) => (
              <label key={name}>
                <code>{name}</code>
                <input
                  type="number"
                  step="0.05"
                  min={min}
                  max={max}
                  value={curve[index]}
                  onChange={(e) =>
                    set(index, Math.min(max, Math.max(min, Number(e.target.value) || 0)))
                  }
                />
              </label>
            ))}
          </fieldset>
          <SegmentedControl
            label="transition-duration"
            size="sm"
            options={props.durations.map((d) => ({ value: String(d), label: `${d}ms` }))}
            value={duration}
            onChange={setDuration}
          />
          <pre className={styles.code}>
            <code>{`transition: translate ${duration}ms ${css};`}</code>
          </pre>
        </div>
      </div>

      <figure className={styles.strip}>
        <figcaption>Where it is at each tenth of the time (time runs down)</figcaption>
        <ol className={styles.frames}>
          {frames.map((p, i) => (
            <li key={i}>
              <span className={styles.time}>{i * 10}%</span>
              <span className={styles.track}>
                <span
                  className={styles.dot}
                  style={{
                    insetInlineStart: `calc(${Math.min(1.1, Math.max(-0.1, p)) * 100}% - 6px)`,
                  }}
                />
              </span>
              <span className={styles.progress}>{Math.round(p * 100)}%</span>
            </li>
          ))}
        </ol>
      </figure>

      <div className={styles.demo}>
        <button
          type="button"
          className={styles.play}
          disabled={reduced}
          onClick={() => setMoved((m) => !m)}
        >
          <Play aria-hidden="true" /> Play
        </button>
        <span className={styles.lane}>
          <span
            className={styles.ball}
            data-moved={moved || undefined}
            style={{ transition: `translate ${duration}ms ${css}` }}
          />
        </span>
        {reduced && (
          <p className={styles.note}>
            Motion is reduced in your settings, so the demo stays still; the filmstrip shows the
            same movement.
          </p>
        )}
      </div>
    </div>
  );
}
