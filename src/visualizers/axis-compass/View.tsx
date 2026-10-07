import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { AxisCompassProps } from './build.ts';
import { axes, DIRECTION_FOR, describeAxes, SYMBOL, type Arrow, type Direction } from './model.ts';
import styles from './View.module.css';

type Justify = 'flex-start' | 'center' | 'flex-end' | 'space-between';
type Align = 'flex-start' | 'center' | 'flex-end' | 'stretch';

const ICONS: Record<Arrow, typeof ArrowRight> = {
  right: ArrowRight,
  left: ArrowLeft,
  down: ArrowDown,
  up: ArrowUp,
};

/** Axis arrows run through the middle of the container, under the items, with a head at the end. */
const STAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  .wrap { position: relative; padding: 12px; background: #eef1f5; }
  .box { display: flex; gap: 8px; height: 220px; padding: 8px; border: 2px dashed #64748b; border-radius: 6px; }
  .item { position: relative; z-index: 1; display: grid; place-items: center; min-width: 44px; min-height: 36px; padding: 4px 10px; border-radius: 4px; background: #1d4ed8; color: #fff; font: 600 15px/1.2 system-ui, sans-serif; }
  .item:nth-child(2) { padding-block: 14px; }
  .item:nth-child(3) { padding-inline: 22px; }
  .axis { position: absolute; pointer-events: none; }
  .axis::after { content: ""; position: absolute; border: 8px solid transparent; }
  .axis.main { --c: #c2410c; }
  .axis.cross { --c: #15803d; }
  .axis.right, .axis.left { top: 50%; left: 24px; right: 24px; border-top: 3px solid var(--c); }
  .axis.down, .axis.up { left: 50%; top: 24px; bottom: 24px; border-left: 3px solid var(--c); }
  .axis.cross.right, .axis.cross.left { border-top-style: dashed; }
  .axis.cross.down, .axis.cross.up { border-left-style: dashed; }
  .axis.right::after { right: -10px; top: -9.5px; border-left-color: var(--c); }
  .axis.left::after { left: -10px; top: -9.5px; border-right-color: var(--c); }
  .axis.down::after { bottom: -10px; left: -9.5px; border-top-color: var(--c); }
  .axis.up::after { top: -10px; left: -9.5px; border-bottom-color: var(--c); }
`;

export default function AxisCompassView({ props }: VisualizerViewProps<AxisCompassProps>) {
  const [direction, setDirection] = useState<Direction>(props.direction);
  const [justify, setJustify] = useState<Justify>('flex-start');
  const [align, setAlign] = useState<Align>('flex-start');
  const { main, cross } = axes(direction);

  const html = `<div class="wrap">
  <div class="box">${props.items.map((text, i) => `<div class="item">${i + 1}. ${text}</div>`).join('')}</div>
  <div class="axis main ${main}"></div>
  <div class="axis cross ${cross}"></div>
</div>`;
  const css = `${STAGE_CSS}
  .box { flex-direction: ${direction}; justify-content: ${justify}; align-items: ${align}; }`;

  const compass = (arrow: Arrow) => {
    const Icon = ICONS[arrow];
    return (
      <button
        type="button"
        className={styles.arrow}
        data-arrow={arrow}
        aria-pressed={DIRECTION_FOR[arrow] === direction}
        aria-label={`flex-direction: ${DIRECTION_FOR[arrow]}`}
        onClick={() => setDirection(DIRECTION_FOR[arrow])}
      >
        <Icon aria-hidden="true" />
      </button>
    );
  };

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <ShadowStage html={html} css={css} className={styles.stage} inert />
        <div className={styles.side}>
          <div className={styles.compass} role="group" aria-label="Main axis direction">
            {compass('up')}
            {compass('left')}
            <code className={styles.center}>{direction}</code>
            {compass('right')}
            {compass('down')}
          </div>
          <ul className={styles.legend}>
            <li data-axis="main">Main axis {SYMBOL[main]}</li>
            <li data-axis="cross">Cross axis {SYMBOL[cross]}</li>
          </ul>
        </div>
      </div>

      <p className={styles.result} aria-live="polite">
        {describeAxes(direction)}
      </p>

      <div className={styles.controls}>
        <SegmentedControl<Justify>
          label={`justify-content (along the main axis ${SYMBOL[main]})`}
          size="sm"
          options={(['flex-start', 'center', 'flex-end', 'space-between'] as const).map((v) => ({
            value: v,
            label: v,
          }))}
          value={justify}
          onChange={setJustify}
        />
        <SegmentedControl<Align>
          label={`align-items (along the cross axis ${SYMBOL[cross]})`}
          size="sm"
          options={(['flex-start', 'center', 'flex-end', 'stretch'] as const).map((v) => ({
            value: v,
            label: v,
          }))}
          value={align}
          onChange={setAlign}
        />
      </div>
    </div>
  );
}
