import { Check, X } from 'lucide-react';
import { useId, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import type { ColorLabProps } from './build.ts';
import {
  contrast,
  formatHsl,
  formatOklch,
  formatRatio,
  formatRgb,
  hslToRgb,
  oklchToRgb,
  toHex,
  verdict,
  type Rgb,
} from './model.ts';
import styles from './View.module.css';

type Notation = 'hex' | 'rgb' | 'hsl' | 'oklch';

const NOTATIONS: readonly { id: Notation; format: (rgb: Rgb) => string }[] = [
  { id: 'hex', format: toHex },
  { id: 'rgb', format: formatRgb },
  { id: 'hsl', format: formatHsl },
  { id: 'oklch', format: formatOklch },
];

const BLACK: Rgb = { r: 0, g: 0, b: 0 };

let painter: CanvasRenderingContext2D | null | undefined;

/** Lets the browser parse whatever the learner typed, then reads back the painted sRGB pixel. */
function parseColor(text: string): Rgb | null {
  if (!CSS.supports('color', text)) return null;
  if (painter === undefined) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    painter = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!painter) return null;
  painter.clearRect(0, 0, 1, 1);
  painter.fillStyle = text;
  painter.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = painter.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

function Verdict({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={styles.verdict} data-ok={ok || undefined}>
      {ok ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
      <span>
        {children}: {ok ? 'passes' : 'fails'}
      </span>
    </li>
  );
}

export default function ColorLabView({ props }: VisualizerViewProps<ColorLabProps>) {
  const id = useId();
  const [rgb, setRgb] = useState<Rgb>(() => parseHex(props.color));
  const [drafts, setDrafts] = useState<Partial<Record<Notation, string>>>({});
  const [bgIndex, setBgIndex] = useState('0');
  const [space, setSpace] = useState<'hsl' | 'oklch'>('hsl');

  const bg = props.backgrounds[Number(bgIndex)] ?? props.backgrounds[0];
  const bgRgb = parseHex(bg?.color ?? '#000000');
  const ratio = contrast(rgb, bgRgb);
  const pass = verdict(ratio);

  const edit = (notation: Notation, text: string) => {
    setDrafts({ [notation]: text });
    const parsed = parseColor(text.trim());
    if (parsed) setRgb(parsed);
  };

  const swatches = props.hues.map((h) => {
    const color =
      space === 'hsl'
        ? hslToRgb({ h, s: props.hsl.s, l: props.hsl.l })
        : oklchToRgb({ l: props.oklch.l, c: props.oklch.c, h });
    const css =
      space === 'hsl'
        ? `hsl(${h} ${props.hsl.s}% ${props.hsl.l}%)`
        : `oklch(${props.oklch.l * 100}% ${props.oklch.c} ${h})`;
    return { h, color, css, ratio: contrast(color, BLACK) };
  });

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby={`${id}-one`}>
          <h3 id={`${id}-one`} className={styles.title}>
            One colour, four notations
          </h3>
          <div
            className={styles.preview}
            style={{ backgroundColor: toHex(bgRgb), color: toHex(rgb) }}
          >
            <p className={styles.sample}>{props.sample}</p>
            <p className={styles.sampleSmall}>Body text has to pass 4.5:1.</p>
          </div>
          {props.backgrounds.length > 1 && (
            <SegmentedControl
              label="Background"
              size="sm"
              options={props.backgrounds.map((b, i) => ({ value: String(i), label: b.label }))}
              value={bgIndex}
              onChange={setBgIndex}
            />
          )}
          <div className={styles.fields}>
            {NOTATIONS.map(({ id: notation, format }) => {
              const draft = drafts[notation];
              const invalid = draft !== undefined && parseColor(draft.trim()) === null;
              return (
                <label key={notation} className={styles.field}>
                  <span className={styles.fieldLabel}>{notation}</span>
                  <input
                    className={styles.input}
                    value={draft ?? format(rgb)}
                    spellCheck={false}
                    autoComplete="off"
                    aria-invalid={invalid || undefined}
                    onChange={(e) => edit(notation, e.target.value)}
                    onBlur={() => !invalid && setDrafts({})}
                  />
                  {invalid && (
                    <span className={styles.error}>Not a colour the browser accepts</span>
                  )}
                </label>
              );
            })}
          </div>
          <div className={styles.contrast} aria-live="polite">
            <p>
              Contrast with the background: <strong>{formatRatio(ratio)}</strong>
            </p>
            <ul className={styles.verdicts}>
              <Verdict ok={pass.text}>Body text (4.5:1)</Verdict>
              <Verdict ok={pass.large}>Large text and icons (3:1)</Verdict>
            </ul>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby={`${id}-two`}>
          <h3 id={`${id}-two`} className={styles.title}>
            Same lightness?
          </h3>
          <SegmentedControl<'hsl' | 'oklch'>
            label="Notation"
            size="sm"
            options={[
              { value: 'hsl', label: `hsl(h ${props.hsl.s}% ${props.hsl.l}%)` },
              { value: 'oklch', label: `oklch(${props.oklch.l * 100}% ${props.oklch.c} h)` },
            ]}
            value={space}
            onChange={setSpace}
          />
          <ul className={styles.swatches}>
            {swatches.map((s) => (
              <li key={s.h}>
                <button
                  type="button"
                  className={styles.swatch}
                  style={{ backgroundColor: toHex(s.color), color: toHex(BLACK) }}
                  aria-label={`Edit ${s.css}, contrast with black text ${formatRatio(s.ratio)}`}
                  onClick={() => {
                    setRgb(s.color);
                    setDrafts({});
                  }}
                >
                  <span aria-hidden="true">Aa</span>
                  <span className={styles.ratio} aria-hidden="true">
                    {formatRatio(s.ratio)}
                  </span>
                </button>
                <code className={styles.swatchLabel}>h {s.h}</code>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Each swatch shows its contrast with black text. Click one to edit it.
          </p>
        </section>
      </div>
    </div>
  );
}

function parseHex(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
