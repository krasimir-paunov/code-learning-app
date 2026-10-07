import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { AlignPadProps } from './build.ts';
import {
  alignmentFor,
  placeOf,
  pushMargin,
  type Alignment,
  type Direction,
  type Place,
  type Spread,
} from './model.ts';
import styles from './View.module.css';

const PLACES: readonly Place[] = ['start', 'center', 'end'];
const SPREADS: readonly Spread[] = ['space-between', 'space-around', 'space-evenly'];
const VERTICAL_WORDS: Record<Place, string> = { start: 'top', center: 'middle', end: 'bottom' };
const HORIZONTAL_WORDS: Record<Place, string> = { start: 'left', center: 'centre', end: 'right' };

const STAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  .wrap { padding: 12px; background: #eef1f5; }
  .box { display: flex; height: 200px; padding: 8px; border: 2px dashed #64748b; border-radius: 6px; }
  .item { display: grid; place-items: center; min-width: 44px; padding: 6px 12px; border-radius: 4px; background: #1d4ed8; color: #fff; font: 600 15px/1.2 system-ui, sans-serif; }
  .item:first-child { background: #0f172a; }
  .item[data-push] { outline: 3px solid #f59e0b; outline-offset: 2px; }
`;

export default function AlignPadView({ props }: VisualizerViewProps<AlignPadProps>) {
  const [direction, setDirection] = useState<Direction>('row');
  const [alignment, setAlignment] = useState<Alignment>({
    justifyContent: 'start',
    alignItems: 'start',
  });
  const [gap, setGap] = useState('0');
  const [push, setPush] = useState('none');

  const place = placeOf(direction, alignment);
  const pushIndex = props.items.indexOf(push);
  const margin = pushMargin(direction);

  const html = `<div class="wrap"><div class="box">${props.items
    .map((text, i) => `<div class="item"${i === pushIndex ? ' data-push' : ''}>${text}</div>`)
    .join('')}</div></div>`;
  const container = [
    'display: flex',
    ...(direction === 'column' ? ['flex-direction: column'] : []),
    `justify-content: ${alignment.justifyContent}`,
    `align-items: ${alignment.alignItems}`,
    ...(gap !== '0' ? [`gap: ${gap}px`] : []),
  ];
  const itemRule = pushIndex >= 0 ? `.item[data-push] { ${margin}: auto; }` : '';
  const css = `${STAGE_CSS}\n.box { ${container.join('; ')}; }\n${itemRule}`;

  const cell = (vertical: Place, horizontal: Place) => {
    const pressed = place.horizontal === horizontal && place.vertical === vertical;
    return (
      <button
        key={`${vertical}-${horizontal}`}
        type="button"
        className={styles.cell}
        aria-pressed={pressed}
        aria-label={`${VERTICAL_WORDS[vertical]} ${HORIZONTAL_WORDS[horizontal]}`}
        onClick={() => setAlignment(alignmentFor(direction, horizontal, vertical))}
      >
        <span aria-hidden="true" />
      </button>
    );
  };

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <ShadowStage html={html} css={css} className={styles.stage} inert />
        <div className={styles.side}>
          <SegmentedControl<Direction>
            label="flex-direction"
            size="sm"
            options={[
              { value: 'row', label: 'row' },
              { value: 'column', label: 'column' },
            ]}
            value={direction}
            onChange={(next) => {
              // Keep the items where they are on screen; only the declarations change.
              const { horizontal, vertical } = placeOf(direction, alignment);
              setDirection(next);
              if (horizontal && vertical) setAlignment(alignmentFor(next, horizontal, vertical));
            }}
          />
          <div role="group" aria-label="Put the items" className={styles.padGroup}>
            <p className={styles.label}>Put the items…</p>
            <div className={styles.pad}>
              {PLACES.map((vertical) => PLACES.map((horizontal) => cell(vertical, horizontal)))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div role="group" aria-label="Spread along the main axis" className={styles.spread}>
          <p className={styles.label}>…or spread them along the main axis</p>
          <div className={styles.buttons}>
            {SPREADS.map((spread) => (
              <button
                key={spread}
                type="button"
                className={styles.button}
                aria-pressed={alignment.justifyContent === spread}
                onClick={() => setAlignment((a) => ({ ...a, justifyContent: spread }))}
              >
                {spread}
              </button>
            ))}
          </div>
        </div>
        <SegmentedControl
          label="gap"
          size="sm"
          options={['0', '8', '24'].map((v) => ({ value: v, label: `${v}px` }))}
          value={gap}
          onChange={setGap}
        />
        <SegmentedControl
          label={`${margin}: auto on`}
          size="sm"
          options={['none', ...props.items.slice(1)].map((v) => ({ value: v, label: v }))}
          value={push}
          onChange={setPush}
        />
      </div>

      <pre className={styles.code} aria-live="polite">
        <code>
          {`.box {\n${container.map((d) => `  ${d};`).join('\n')}\n}`}
          {itemRule &&
            `\n.item.${push.toLowerCase().replaceAll(/\s+/g, '-')} {\n  ${margin}: auto;\n}`}
        </code>
      </pre>
    </div>
  );
}
