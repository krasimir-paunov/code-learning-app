import { MoveHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { useElementWidth } from '../../components/use-element-width.ts';
import { mountSandbox } from '../../engine/runners/web-sandbox/index.ts';
import type { VisualizerViewProps } from '../contract.ts';
import type { ViewportLabProps } from './build.ts';
import { breakpoints, matches } from './model.ts';
import styles from './View.module.css';

const MIN = 320;
const STEP = 10;
const HANDLE = 28;

/** The page in a real iframe; resizing the host resizes the viewport its media queries see. */
function Page({ html, css }: { html: string; css: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const handle = mountSandbox(
      element,
      { files: { 'index.html': html, 'style.css': css } },
      { title: 'The page' },
    );
    return () => handle.dispose();
  }, [html, css]);
  return <div ref={host} className={styles.page} />;
}

export default function ViewportLabView({ props }: VisualizerViewProps<ViewportLabProps>) {
  const [variant, setVariant] = useState('0');
  const [width, setWidth] = useState(props.start);
  const [areaRef, available] = useElementWidth();
  const drag = useRef<{ x: number; width: number } | null>(null);

  const css = props.variants[Number(variant)]?.css ?? props.variants[0]?.css ?? '';
  const max = Math.max(MIN, (available ?? props.start) - HANDLE);
  const shown = Math.min(Math.max(width, MIN), max);
  const queries = [...css.matchAll(/@media\s*([^{]+)\{/g)].map((m) => (m[1] ?? '').trim());
  const marks = breakpoints(queries);

  const set = (next: number) => setWidth(Math.round(Math.min(max, Math.max(MIN, next))));
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, width: shown };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag.current) set(drag.current.width + e.clientX - drag.current.x);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const by = { ArrowLeft: -STEP, ArrowRight: STEP, PageDown: -100, PageUp: 100 }[e.key];
    if (by === undefined) return;
    e.preventDefault();
    set(shown + by);
  };

  return (
    <div className={styles.frame}>
      {props.variants.length > 1 && (
        <SegmentedControl
          label="The same layout, written"
          size="sm"
          options={props.variants.map((v, i) => ({ value: String(i), label: v.name }))}
          value={variant}
          onChange={setVariant}
        />
      )}

      <div ref={areaRef} className={styles.area}>
        <div
          className={styles.viewport}
          style={{ inlineSize: shown + HANDLE, blockSize: props.height }}
        >
          <Page html={props.html} css={css} />
          <button
            type="button"
            className={styles.handle}
            aria-label={`Viewport width ${shown}px. Drag, or use the arrow keys.`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={onKeyDown}
          >
            <MoveHorizontal aria-hidden="true" />
          </button>
        </div>
        <div className={styles.ruler} aria-hidden="true">
          {marks
            .filter((px) => px <= max)
            .map((px) => (
              <span key={px} className={styles.mark} style={{ insetInlineStart: px }}>
                {px}
              </span>
            ))}
          <span className={styles.now} style={{ insetInlineStart: shown }} />
        </div>
      </div>

      <p className={styles.width} aria-live="polite">
        Viewport: <strong>{shown}px</strong> ({Math.round((shown / 16) * 10) / 10}rem)
      </p>

      <ul className={styles.queries}>
        {queries.map((q, i) => {
          const on = matches(q, shown);
          return (
            <li key={`${q}-${i}`} data-on={on || undefined}>
              <code>@media {q}</code>
              <span>{on ? 'applies' : 'doesn’t apply'}</span>
            </li>
          );
        })}
      </ul>

      <pre className={styles.code}>
        <code>{css.trim()}</code>
      </pre>
    </div>
  );
}
