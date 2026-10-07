import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import type { UnitLabProps } from './build.ts';
import { DEPENDS_ON, nestedSizes, toPx, type Context } from './model.ts';
import styles from './View.module.css';

let measurer: CanvasRenderingContext2D | null | undefined;

/** Width of "0" in the given font, measured by the browser's text engine. */
function zeroWidth(font: number, family: string): number {
  measurer ??= document.createElement('canvas').getContext('2d');
  if (!measurer) return font * 0.5;
  measurer.font = `${font}px ${family}`;
  return measurer.measureText('0').width;
}

const round = (n: number) => Math.round(n * 10) / 10;

export default function UnitLabView({ props }: VisualizerViewProps<UnitLabProps>) {
  const [rootFont, setRootFont] = useState(props.defaults.rootFont);
  const [font, setFont] = useState(props.defaults.font);
  const [parentWidth, setParentWidth] = useState(props.defaults.parentWidth);
  const [viewportWidth, setViewportWidth] = useState(props.defaults.viewportWidth);
  const [nestUnit, setNestUnit] = useState<'em' | 'rem'>('em');
  const ctx: Context = {
    rootFont,
    font,
    parentWidth,
    viewportWidth,
    zeroWidth: zeroWidth(font, props.fontFamily),
  };
  const rows = props.lengths.map((length) => ({ ...length, px: toPx(length, ctx) }));
  const scale = Math.max(parentWidth, ...rows.map((r) => r.px));
  const nested = nestedSizes(0.8, nestUnit, 4, rootFont);

  return (
    <div className={styles.frame}>
      <div className={styles.controls}>
        <Slider
          label="Browser text size (root font-size)"
          min={12}
          max={32}
          value={rootFont}
          onChange={setRootFont}
          format={(v) => `${v}px`}
        />
        <Slider
          label="This element’s font-size"
          min={10}
          max={32}
          value={font}
          onChange={setFont}
          format={(v) => `${v}px`}
        />
        <Slider
          label="Parent width"
          min={200}
          max={700}
          step={10}
          value={parentWidth}
          onChange={setParentWidth}
          format={(v) => `${v}px`}
        />
        <Slider
          label="Viewport width"
          min={320}
          max={1600}
          step={10}
          value={viewportWidth}
          onChange={setViewportWidth}
          format={(v) => `${v}px`}
        />
      </div>

      <ul className={styles.bars} aria-label="Widths">
        {rows.map((row) => (
          <li key={`${row.value}${row.unit}`} className={styles.row} data-unit={row.unit}>
            <code className={styles.value}>
              width: {row.value}
              {row.unit}
            </code>
            <span className={styles.track}>
              <span className={styles.bar} style={{ inlineSize: `${(row.px / scale) * 100}%` }} />
              <span
                className={styles.parentMark}
                style={{ insetInlineStart: `${(parentWidth / scale) * 100}%` }}
                aria-hidden="true"
              />
            </span>
            <span className={styles.px}>{round(row.px)}px</span>
            <span className={styles.depends}>depends on {DEPENDS_ON[row.unit]}</span>
          </li>
        ))}
      </ul>
      <p className={styles.legend}>The dashed line marks the parent’s width.</p>

      <section className={styles.nesting} aria-label="Nesting">
        <div className={styles.nestingHead}>
          <h3 className={styles.title}>Four nested elements, each with font-size: 0.8{nestUnit}</h3>
          <SegmentedControl<'em' | 'rem'>
            label="Unit"
            hideLabel
            size="sm"
            options={[
              { value: 'em', label: '0.8em' },
              { value: 'rem', label: '0.8rem' },
            ]}
            value={nestUnit}
            onChange={setNestUnit}
          />
        </div>
        <ol className={styles.levels}>
          {nested.map((size, level) => (
            <li key={level} style={{ fontSize: size, marginInlineStart: `${level * 1.25}rem` }}>
              Level {level + 1}: {round(size)}px
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
