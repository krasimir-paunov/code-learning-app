import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { PatternLabProps } from './build.ts';
import { lineCount, patternCss } from './model.ts';
import styles from './View.module.css';

const PAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  .viewport { box-sizing: border-box; padding: 12px; background: #eef1f5; font: 15px/1.4 system-ui, sans-serif; }
`;

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

interface Measured {
  lines: number;
  overflow: number;
}

export default function PatternLabView({ props }: VisualizerViewProps<PatternLabProps>) {
  const [patternIndex, setPatternIndex] = useState('0');
  const pattern = props.patterns[Number(patternIndex)] ?? props.patterns[0];
  const [enabled, setEnabled] = useState<Set<number>>(() => new Set());
  const [width, setWidth] = useState(props.width.start);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [areaRef, available] = useWidth();
  if (!pattern) return null;

  // Never wider than the space on screen, so the page itself never scrolls sideways.
  const max = Math.max(props.width.min, Math.min(props.width.max, available ?? props.width.max));
  const shown = Math.min(width, max);

  const css = `${PAGE_CSS}\n.viewport { width: ${shown}px; }\n${patternCss(pattern.base, pattern.toggles, enabled)}`;
  const missing = pattern.toggles.filter((_, i) => !enabled.has(i));

  return (
    <div className={styles.frame}>
      {props.patterns.length > 1 && (
        <SegmentedControl
          label="Pattern"
          size="sm"
          options={props.patterns.map((p, i) => ({ value: String(i), label: p.name }))}
          value={patternIndex}
          onChange={(value) => {
            setPatternIndex(value);
            setEnabled(new Set());
          }}
        />
      )}

      <fieldset className={styles.rule}>
        <legend>The declarations that make it work</legend>
        {pattern.toggles.map((t, i) => (
          <label key={`${pattern.name}-${i}`} className={styles.toggle}>
            <input
              type="checkbox"
              checked={enabled.has(i)}
              onChange={(e) =>
                setEnabled((s) => {
                  const next = new Set(s);
                  if (e.target.checked) next.add(i);
                  else next.delete(i);
                  return next;
                })
              }
            />
            <code>
              {t.selector} {'{'} {t.declaration}; {'}'}
            </code>
          </label>
        ))}
      </fieldset>

      <Slider
        label="Available width"
        min={props.width.min}
        max={max}
        step={10}
        value={shown}
        onChange={setWidth}
        format={(v) => `${v}px`}
      />

      <div ref={areaRef} className={styles.area}>
        <ShadowStage
          html={`<div class="viewport">${pattern.html}</div>`}
          css={css}
          className={styles.stage}
          inert
          onRender={(root) => {
            const container = root.querySelector<HTMLElement>(pattern.container);
            const items = [...root.querySelectorAll<HTMLElement>(pattern.items)];
            const viewport = root.querySelector<HTMLElement>('.viewport');
            if (!container || !viewport) return;
            const edge = viewport.getBoundingClientRect().right - 12;
            const next: Measured = {
              lines: lineCount(items.map((el) => Math.round(el.getBoundingClientRect().top))),
              overflow: Math.max(
                0,
                Math.round(Math.max(...items.map((el) => el.getBoundingClientRect().right)) - edge),
              ),
            };
            setMeasured((m) =>
              m?.lines === next.lines && m.overflow === next.overflow ? m : next,
            );
          }}
        />
      </div>

      <div className={styles.report} aria-live="polite">
        {measured && (
          <p>
            Items on <strong>{measured.lines}</strong> {measured.lines === 1 ? 'line' : 'lines'}.{' '}
            {measured.overflow > 0 ? (
              <strong className={styles.bad}>
                They stick out {measured.overflow}px past the edge.
              </strong>
            ) : (
              'Everything fits.'
            )}
          </p>
        )}
        {missing.length > 0 && (
          <ul className={styles.missing}>
            {missing.map((t) => (
              <li key={t.declaration}>
                Without <code>{t.declaration}</code>: {t.without}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
