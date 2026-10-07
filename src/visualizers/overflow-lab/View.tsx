import { MoveDiagonal2 } from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { OverflowLabProps } from './build.ts';
import {
  describe,
  ELLIPSIS_DECLARATIONS,
  ellipsisResult,
  FACTS,
  OVERFLOWS,
  type EllipsisParts,
  type Overflow,
} from './model.ts';
import styles from './View.module.css';

const STEP = 10;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const PART_KEYS = Object.keys(ELLIPSIS_DECLARATIONS) as (keyof EllipsisParts)[];

interface Measured {
  content: number;
  box: number;
}

export default function OverflowLabView({ props }: VisualizerViewProps<OverflowLabProps>) {
  const [overflow, setOverflow] = useState<Overflow>(props.overflow);
  const [size, setSize] = useState(props.size);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [parts, setParts] = useState<EllipsisParts>({
    nowrap: false,
    hidden: false,
    ellipsis: false,
  });
  const drag = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const fit = (width: number, height: number) => ({
    width: clamp(Math.round(width), props.min.width, props.max.width),
    height: clamp(Math.round(height), props.min.height, props.max.height),
  });

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ...size };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (start) setSize(fit(start.width + e.clientX - start.x, start.height + e.clientY - start.y));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
      ArrowDown: [0, STEP],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    setSize((s) => fit(s.width + d[0], s.height + d[1]));
  };

  const boxCss = `
    .box {
      box-sizing: border-box;
      width: ${size.width}px;
      height: ${size.height}px;
      overflow: ${overflow};
      padding: 8px 10px;
      border: 2px solid var(--accent);
      line-height: 1.5;
    }
    .box > :first-child { margin-block-start: 0; }
    .box > :last-child { margin-block-end: 0; }
    .next {
      margin-block-start: 12px;
      padding: 10px;
      background: var(--bg-3);
      color: var(--text-2);
    }`;

  const overflowing = measured !== null && measured.content > measured.box + 1;
  const facts = FACTS[overflow];

  const titleCss = `
    .card {
      box-sizing: border-box;
      width: ${props.titleWidth}px;
      padding: 12px;
      border: 1px solid var(--border-strong);
      border-radius: 8px;
    }
    .title {
      margin: 0;
      font-weight: 700;
      ${parts.nowrap ? 'white-space: nowrap;' : ''}
      ${parts.hidden ? 'overflow: hidden;' : ''}
      ${parts.ellipsis ? 'text-overflow: ellipsis;' : ''}
    }
    .price { margin: 4px 0 0; color: var(--text-2); }`;

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="overflow-lab-box">
          <h3 id="overflow-lab-box" className={styles.title}>
            A box with more content than fits
          </h3>
          <SegmentedControl<Overflow>
            label="overflow"
            size="sm"
            options={OVERFLOWS.map((o) => ({ value: o, label: o }))}
            value={overflow}
            onChange={setOverflow}
          />
          <div className={styles.stageWrap}>
            <ShadowStage
              html={`<div class="box">${props.content}</div><div class="next">${props.next}</div>`}
              css={boxCss}
              className={styles.stage}
              style={{
                // Tall enough to show everything that spills out, plus the next section.
                minBlockSize: `calc(2 * var(--space-4) + ${Math.max(size.height, measured?.content ?? 0)}px + 4rem)`,
              }}
              inert
              onRender={(root) => {
                const box = root.querySelector<HTMLElement>('.box');
                if (!box) return;
                const next = { content: box.scrollHeight, box: box.clientHeight };
                setMeasured((m) => (m?.content === next.content && m.box === next.box ? m : next));
              }}
            />
            <button
              type="button"
              className={styles.handle}
              style={{
                insetInlineStart: `calc(var(--space-4) + var(--border-width) + ${size.width}px)`,
                insetBlockStart: `calc(var(--space-4) + var(--border-width) + ${size.height}px)`,
              }}
              aria-label={`Resize the box (arrow keys), now ${size.width} × ${size.height}px`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={onKeyDown}
            >
              <MoveDiagonal2 aria-hidden="true" />
            </button>
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Box</dt>
              <dd>
                {size.width} × {size.height}px
              </dd>
            </div>
            <div>
              <dt>Content</dt>
              <dd>{measured ? `${measured.content}px tall` : '…'}</dd>
            </div>
            <div>
              <dt>Clips</dt>
              <dd>{facts.clips ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt>User can scroll</dt>
              <dd>{facts.userScroll ? 'yes' : 'no'}</dd>
            </div>
          </dl>
          <p className={styles.result} aria-live="polite">
            {describe(overflow, overflowing)}
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="overflow-lab-ellipsis">
          <h3 id="overflow-lab-ellipsis" className={styles.title}>
            Truncating a title
          </h3>
          <ShadowStage
            html={`<div class="card"><p class="title">${props.title}</p><p class="price">$129</p></div>`}
            css={titleCss}
            className={styles.stage}
            inert
          />
          <fieldset className={styles.rule}>
            <legend className={styles.selector}>
              <code>.title {'{'}</code>
            </legend>
            {PART_KEYS.map((key) => (
              <label key={key} className={styles.declaration}>
                <input
                  type="checkbox"
                  checked={parts[key]}
                  onChange={(e) => setParts((p) => ({ ...p, [key]: e.target.checked }))}
                />
                <code>{ELLIPSIS_DECLARATIONS[key]};</code>
              </label>
            ))}
            <code aria-hidden="true">{'}'}</code>
          </fieldset>
          <p className={styles.result} aria-live="polite">
            {ellipsisResult(parts)}
          </p>
        </section>
      </div>
    </div>
  );
}
