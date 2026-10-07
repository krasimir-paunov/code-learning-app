import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { SizingLabProps } from './build.ts';
import { columns, sizingCss, type BoxSizing } from './model.ts';
import styles from './View.module.css';

interface Measured {
  widths: number[];
  sameRow: boolean;
}

export default function SizingLabView({ props }: VisualizerViewProps<SizingLabProps>) {
  const [padding, setPadding] = useState(props.padding);
  const [border, setBorder] = useState(props.border);
  const [sizing, setSizing] = useState<BoxSizing>(props.sizing);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const input = { container: props.container, percent: props.percent, padding, border, sizing };
  const predicted = columns(input);
  const css = `${sizingCss(input)}
.row { display: flex; flex-wrap: wrap; width: ${props.container}px; outline: 2px dashed var(--accent); }
.col { flex: none; background: color-mix(in oklch, var(--track-css) 30%, transparent); }
.col + .col { background: color-mix(in oklch, var(--track-html) 30%, transparent); }`;
  const html =
    '<div class="row"><div class="col">Column A</div><div class="col">Column B</div></div>';

  return (
    <div className={styles.frame}>
      <div className={styles.controls}>
        <SegmentedControl<BoxSizing>
          label="box-sizing"
          options={[
            { value: 'content-box', label: 'content-box (default)' },
            { value: 'border-box', label: 'border-box' },
          ]}
          value={sizing}
          onChange={setSizing}
        />
        <Slider
          label="padding"
          min={0}
          max={60}
          value={padding}
          onChange={setPadding}
          format={(v) => `${v}px`}
        />
        <Slider
          label="border"
          min={0}
          max={12}
          value={border}
          onChange={setBorder}
          format={(v) => `${v}px`}
        />
      </div>

      <div className={styles.stageWrap}>
        <p className={styles.caption}>
          A {props.container}px container with two columns of <code>width: {props.percent}%</code>
        </p>
        <ShadowStage
          html={html}
          css={css}
          className={styles.stage}
          inert
          onRender={(root) => {
            const cols = Array.from(root.querySelectorAll('.col'));
            const next: Measured = {
              widths: cols.map((c) => Math.round(c.getBoundingClientRect().width)),
              sameRow:
                cols.length === 2 &&
                cols[0]?.getBoundingClientRect().top === cols[1]?.getBoundingClientRect().top,
            };
            setMeasured((m) => (JSON.stringify(m) === JSON.stringify(next) ? m : next));
          }}
        />
      </div>

      <div className={styles.readout} aria-live="polite" data-fits={measured?.sameRow || undefined}>
        <p className={styles.verdict}>
          {measured?.sameRow
            ? 'Both columns fit side by side.'
            : 'They don’t fit: column B wraps onto a new line.'}
        </p>
        <p>
          {sizing === 'content-box' ? (
            <>
              <code>width</code> sets the content: {predicted.width} + 2 × {padding} padding + 2 ×{' '}
              {border} border = <strong>{predicted.visible}px</strong> on screen per column.
            </>
          ) : (
            <>
              <code>width</code> is the visible width: <strong>{predicted.visible}px</strong>.
              Padding and border fit inside, leaving {predicted.content}px for content.
            </>
          )}
        </p>
        <p className={styles.muted}>
          Two columns: {predicted.total}px in a {props.container}px container. Measured in the page:{' '}
          {measured ? measured.widths.map((w) => `${w}px`).join(' and ') : '…'}.
        </p>
        <pre className={styles.code}>
          <code>{sizingCss(input)}</code>
        </pre>
      </div>
    </div>
  );
}
