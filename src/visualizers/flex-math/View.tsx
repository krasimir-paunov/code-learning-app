import { useState } from 'react';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { FlexMathProps } from './build.ts';
import { distribute } from './model.ts';
import styles from './View.module.css';

const COLORS = ['#1d4ed8', '#7c3aed', '#0f766e', '#b45309'];
const round = (n: number) => Math.round(n * 10) / 10;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${round(Math.abs(n))}`;

interface Item {
  text: string;
  grow: number;
  shrink: number;
  basis: number;
  minZero: boolean;
}

interface Measured {
  widths: number[];
  minContent: number[];
}

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export default function FlexMathView({ props }: VisualizerViewProps<FlexMathProps>) {
  const [container, setContainer] = useState(props.container);
  const [items, setItems] = useState<Item[]>(() =>
    props.items.map((item) => ({ ...item, minZero: false })),
  );
  const [measured, setMeasured] = useState<Measured | null>(null);

  const edit = (index: number, patch: Partial<Item>) =>
    setItems((all) => all.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const result = distribute(
    items.map((item, i) => ({
      grow: item.grow,
      shrink: item.shrink,
      basis: item.basis,
      min: item.minZero ? 0 : (measured?.minContent[i] ?? 0),
    })),
    container,
  );

  // The row is rendered for real; hidden min-content copies measure each item's smallest size.
  const html = `<div class="row">${items
    .map((item, i) => `<div class="item" data-i="${i}">${escape(item.text)}</div>`)
    .join('')}</div><div class="probe">${items
    .map((item, i) => `<div class="item" data-probe="${i}">${escape(item.text)}</div>`)
    .join('')}</div>`;
  const css = `
    :host { color: #fff; }
    .row { display: flex; width: ${container}px; background: #e2e8f0; outline: 2px dashed #64748b; }
    .item { box-sizing: border-box; padding: 8px; font: 600 14px/1.3 system-ui, sans-serif; white-space: normal; }
    .probe { position: absolute; visibility: hidden; }
    .probe .item { width: min-content; }
    ${items
      .map(
        (item, i) =>
          `[data-i="${i}"] { flex: ${item.grow} ${item.shrink} ${item.basis}px; background: ${COLORS[i % COLORS.length]};${item.minZero ? ' min-width: 0; overflow-wrap: anywhere;' : ''} }`,
      )
      .join('\n')}
  `;

  return (
    <div className={styles.frame}>
      <ShadowStage
        html={html}
        css={css}
        className={styles.stage}
        inert
        onRender={(root) => {
          const width = (el: Element | null) =>
            Math.round((el?.getBoundingClientRect().width ?? 0) * 100) / 100;
          const next: Measured = {
            widths: items.map((_, i) => width(root.querySelector(`[data-i="${i}"]`))),
            minContent: items.map((_, i) => width(root.querySelector(`[data-probe="${i}"]`))),
          };
          setMeasured((m) => (JSON.stringify(m) === JSON.stringify(next) ? m : next));
        }}
      />

      <Slider
        label="Container width"
        min={200}
        max={700}
        step={10}
        value={container}
        onChange={setContainer}
        format={(v) => `${v}px`}
      />

      <p className={styles.summary} aria-live="polite">
        Bases add up to {round(items.reduce((s, i) => s + i.basis, 0))}px in a {container}px
        container:{' '}
        {result.mode === 'grow' && (
          <>
            <strong>{round(result.freeSpace)}px of free space</strong>, shared out by{' '}
            <code>flex-grow</code> ({items.map((i) => i.grow).join(' : ')}).
          </>
        )}
        {result.mode === 'shrink' && (
          <>
            <strong>{round(-result.freeSpace)}px too much</strong>, taken back by{' '}
            <code>flex-shrink</code> × basis ({items.map((i) => i.shrink * i.basis).join(' : ')}).
          </>
        )}
        {result.mode === 'none' && <strong>a perfect fit, nothing to share.</strong>}
      </p>

      <ol className={styles.items}>
        {items.map((item, i) => {
          const r = result.items[i];
          if (!r) return null;
          const scale = Math.max(container, ...items.map((it) => it.basis)) || 1;
          return (
            <li key={i} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.swatch} style={{ background: COLORS[i % COLORS.length] }} />
                <span className={styles.name}>{item.text}</span>
              </div>
              <div className={styles.fields}>
                {(['grow', 'shrink', 'basis'] as const).map((key) => (
                  <label key={key} className={styles.field}>
                    <code>flex-{key}</code>
                    <input
                      type="number"
                      min={0}
                      max={key === 'basis' ? 400 : 5}
                      step={key === 'basis' ? 10 : 1}
                      value={item[key]}
                      onChange={(e) => edit(i, { [key]: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </label>
                ))}
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={item.minZero}
                    onChange={(e) => edit(i, { minZero: e.target.checked })}
                  />
                  <code>min-width: 0</code>
                </label>
              </div>
              <div className={styles.bar} aria-hidden="true">
                <span
                  className={styles.basis}
                  style={{ inlineSize: `${(Math.min(item.basis, r.size) / scale) * 100}%` }}
                />
                {r.change > 0 && (
                  <span
                    className={styles.grew}
                    style={{ inlineSize: `${(r.change / scale) * 100}%` }}
                  />
                )}
                {r.change < 0 && (
                  <span
                    className={styles.shrank}
                    style={{ inlineSize: `${(-r.change / scale) * 100}%` }}
                  />
                )}
              </div>
              <p className={styles.math}>
                {item.basis} {signed(r.change)} = <strong>{round(r.size)}px</strong>
                {r.clamped === 'min' && (
                  <span className={styles.clamped}>
                    {' '}
                    stopped at its minimum (
                    {item.minZero ? '0' : `min-content, ${round(measured?.minContent[i] ?? 0)}px`})
                  </span>
                )}
                <span className={styles.browser}>
                  {' '}
                  · browser: {measured ? `${round(measured.widths[i] ?? 0)}px` : '…'}
                </span>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
