import { useEffect, useId, useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { accessibleName } from '../shared/a11y/a11y.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { FocusPathProps } from './build.ts';
import { backwardSteps, tabOrder } from './model.ts';
import styles from './View.module.css';

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

const PAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  .page { display: grid; gap: 26px; padding: 32px 16px 18px; background: #fff; font: 15px/1.4 system-ui, sans-serif; }
  a { color: #1d4ed8; }
  :focus-visible { outline: 3px solid #f59e0b; outline-offset: 2px; }
`;

interface Stop {
  name: string;
  x: number;
  y: number;
  positive: boolean;
}

interface Measured {
  stops: Stop[];
  /** Names of things that look clickable but never get focus. */
  unreachable: string[];
}

function withToggles(
  html: string,
  toggles: FocusPathProps['toggles'],
  on: ReadonlySet<number>,
): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  toggles.forEach((t, i) => {
    if (t.kind !== 'attr' || !on.has(i)) return;
    template.content.querySelector(t.selector)?.setAttribute(t.attr, t.value);
  });
  return template.innerHTML;
}

function measure(root: ShadowRoot, host: HTMLElement): Measured {
  const origin = host.getBoundingClientRect();
  const all = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const order = tabOrder(
    all.map((el, index) => ({
      index,
      tabIndex: el.tabIndex,
      skipped: (el as HTMLButtonElement).disabled === true || !el.checkVisibility(),
    })),
  );
  const stops = order.map((index) => {
    const el = all[index] as HTMLElement;
    const box = el.getBoundingClientRect();
    return {
      name: accessibleName(el) || el.localName,
      x: Math.round(box.left - origin.left + box.width / 2),
      y: Math.round(box.top - origin.top + box.height / 2),
      positive: el.tabIndex > 0,
    };
  });
  const unreachable = [...root.querySelectorAll<HTMLElement>('[data-clickable]')]
    .filter((el) => el.tabIndex < 0)
    .map((el) => el.textContent?.trim() ?? '');
  return { stops, unreachable };
}

export default function FocusPathView({ props }: VisualizerViewProps<FocusPathProps>) {
  const id = useId();
  const [enabled, setEnabled] = useState<Set<number>>(() => new Set());
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState<Measured>({ stops: [], unreachable: [] });
  const [current, setCurrent] = useState<number | null>(null);

  const html = `<div class="page">${withToggles(props.html, props.toggles, enabled)}</div>`;
  const css = [
    PAGE_CSS,
    props.css,
    ...props.toggles.flatMap((t, i) => (t.kind === 'css' && enabled.has(i) ? [t.css] : [])),
  ].join('\n');

  // Which stop the learner is on while tabbing through the page themselves.
  useEffect(() => {
    if (!root) return;
    const focus = (event: Event) => {
      const all = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const order = tabOrder(all.map((el, index) => ({ index, tabIndex: el.tabIndex })));
      const step = order.indexOf(all.indexOf(event.target as HTMLElement));
      setCurrent(step >= 0 ? step : null);
    };
    const leave = () => setCurrent(null);
    root.addEventListener('focusin', focus);
    root.addEventListener('focusout', leave);
    return () => {
      root.removeEventListener('focusin', focus);
      root.removeEventListener('focusout', leave);
    };
  }, [root]);

  const back = backwardSteps(measured.stops);
  const positives = measured.stops.filter((s) => s.positive).map((s) => s.name);

  return (
    <div className={styles.frame}>
      <fieldset className={styles.toggles}>
        <legend>Change the page</legend>
        {props.toggles.map((t, i) => (
          <label key={t.label} className={styles.toggle}>
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
            <span>{t.label}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.board} ref={setHost}>
        <ShadowStage
          html={html}
          css={css}
          className={styles.stage}
          label="The page: Tab through it"
          noNavigation
          onRender={(r) => {
            setRoot((c) => (c === r ? c : r));
            if (!host) return;
            const next = measure(r, host);
            setMeasured((m) => (JSON.stringify(m) === JSON.stringify(next) ? m : next));
          }}
        />
        <svg className={styles.path} aria-hidden="true">
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 z" />
            </marker>
          </defs>
          {measured.stops.slice(1).map((stop, i) => {
            const from = measured.stops[i];
            if (!from) return null;
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={stop.x}
                y2={stop.y}
                className={styles.step}
                data-back={back.includes(i + 1) || undefined}
                markerEnd={`url(#${id}-arrow)`}
              />
            );
          })}
          {measured.stops.map((stop, i) => (
            <g key={i} className={styles.badge} data-current={current === i || undefined}>
              <circle cx={stop.x} cy={stop.y - 18} r="10" />
              <text x={stop.x} y={stop.y - 14} textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p className={styles.hint}>Click into the page and press Tab to walk the path yourself.</p>

      <div className={styles.report} aria-live="polite">
        <ol className={styles.stops}>
          {measured.stops.map((stop, i) => (
            <li key={i} data-current={current === i || undefined}>
              {i + 1}. {stop.name}
              {stop.positive && <span className={styles.flag}> (positive tabindex)</span>}
            </li>
          ))}
        </ol>
        {positives.length > 0 && (
          <p className={styles.warn}>
            A positive <code>tabindex</code> pulls {positives.join(', ')} ahead of everything else.
          </p>
        )}
        {back.length > 0 && (
          <p className={styles.warn}>
            Focus jumps backwards on screen at {back.map((s) => `step ${s + 1}`).join(', ')}: the
            visual order no longer matches the HTML order.
          </p>
        )}
        {measured.unreachable.length > 0 && (
          <p className={styles.warn}>
            Never reached with Tab: {measured.unreachable.join(', ')}. It looks clickable, but a{' '}
            <code>&lt;div&gt;</code> isn’t focusable.
          </p>
        )}
      </div>
    </div>
  );
}
