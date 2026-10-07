import { useEffect, useRef, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { accessibleDescription, accessibleName, role, states } from '../shared/a11y/a11y.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { AriaWorkbenchProps } from './build.ts';
import { liveness, needsName, speak, type AxInfo } from './model.ts';
import styles from './View.module.css';

const PAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  .page { display: grid; gap: 10px; justify-items: start; padding: 16px; background: #fff; font: 15px/1.4 system-ui, sans-serif; }
  button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid #64748b; border-radius: 4px; background: #f8fafc; font: inherit; cursor: pointer; }
  button svg { width: 18px; height: 18px; }
  input { padding: 6px 8px; border: 1px solid #64748b; border-radius: 4px; font: inherit; }
  [aria-invalid="true"] { border-color: #b91c1c; }
  .error { margin: 0; color: #b91c1c; font-size: 14px; }
  ul { margin: 0; padding-left: 20px; }
  .status { min-height: 1.4em; margin: 0; color: #166534; }
  :focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
`;

type Widget = AriaWorkbenchProps['widgets'][number];

function applyToggles(widget: Widget, on: ReadonlySet<number>): string {
  const template = document.createElement('template');
  template.innerHTML = widget.html;
  widget.toggles.forEach((t, i) => {
    if (on.has(i)) template.content.querySelector(t.selector)?.setAttribute(t.attr, t.value);
  });
  return template.innerHTML;
}

function inspect(root: ShadowRoot, selector: string): AxInfo | null {
  const el = root.querySelector(selector);
  if (!el) return null;
  return {
    role: role(el),
    name: accessibleName(el),
    description: accessibleDescription(el),
    states: states(el),
  };
}

interface Announcement {
  id: number;
  text: string;
  heard: boolean;
}

export default function AriaWorkbenchView({ props }: VisualizerViewProps<AriaWorkbenchProps>) {
  const [index, setIndex] = useState('0');
  const widget = props.widgets[Number(index)] ?? props.widgets[0];
  const [enabled, setEnabled] = useState<Set<number>>(() => new Set());
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [info, setInfo] = useState<AxInfo | null>(null);
  const [log, setLog] = useState<Announcement[]>([]);
  // Survives re-renders of the stage, so "before" and "after" changes can be compared.
  const changes = useRef(0);

  const html = widget ? `<div class="page">${applyToggles(widget, enabled)}</div>` : '';

  useEffect(() => {
    if (!root || !widget) return;
    const refresh = () => {
      const next = inspect(root, widget.inspect);
      setInfo((i) => (JSON.stringify(i) === JSON.stringify(next) ? i : next));
    };
    const click = (event: Event) => {
      const target = (event.target as Element).closest('button');
      if (!target) return;
      if (widget.behavior === 'disclosure') {
        const controlled = root.getElementById(target.getAttribute('aria-controls') ?? '');
        if (controlled) {
          const open = controlled.hasAttribute('hidden');
          controlled.toggleAttribute('hidden', !open);
          if (target.hasAttribute('aria-expanded'))
            target.setAttribute('aria-expanded', String(open));
        }
      }
      if (widget.behavior === 'status') {
        const status = root.querySelector('.status');
        if (status) {
          changes.current += 1;
          const count = changes.current;
          const text = `Ridgeline Ultra added to your cart (${count} in total).`;
          status.textContent = text;
          const heard =
            liveness(status.getAttribute('role'), status.getAttribute('aria-live')) !== null;
          setLog((l) => [{ id: count, text, heard }, ...l].slice(0, 4));
        }
      }
      refresh();
    };
    refresh();
    root.addEventListener('click', click);
    root.addEventListener('focusin', refresh);
    return () => {
      root.removeEventListener('click', click);
      root.removeEventListener('focusin', refresh);
    };
  }, [root, widget, html]);

  if (!widget) return null;

  return (
    <div className={styles.frame}>
      {props.widgets.length > 1 && (
        <SegmentedControl
          label="Widget"
          size="sm"
          options={props.widgets.map((w, i) => ({ value: String(i), label: w.name }))}
          value={index}
          onChange={(value) => {
            setIndex(value);
            setEnabled(new Set());
            setLog([]);
            changes.current = 0;
          }}
        />
      )}

      <fieldset className={styles.toggles}>
        <legend>ARIA</legend>
        {widget.toggles.map((t, i) => (
          <label key={`${widget.name}-${t.attr}`} className={styles.toggle}>
            <input
              type="checkbox"
              checked={enabled.has(i)}
              onChange={(e) => {
                setEnabled((s) => {
                  const next = new Set(s);
                  if (e.target.checked) next.add(i);
                  else next.delete(i);
                  return next;
                });
              }}
            />
            <span>
              {t.label} <code>{t.value === '' ? t.attr : `${t.attr}="${t.value}"`}</code>
            </span>
          </label>
        ))}
      </fieldset>

      <div className={styles.layout}>
        {/* The widgets start broken on purpose (a button with no name); the lesson is fixing them. */}
        <div data-a11y-demo>
          <ShadowStage
            html={html}
            css={PAGE_CSS}
            className={styles.stage}
            label="The widget"
            onRender={(r) => setRoot((c) => (c === r ? c : r))}
          />
        </div>
        <section className={styles.panel} aria-label="What assistive technology gets">
          <h3 className={styles.title}>What assistive technology gets</h3>
          {info && (
            <>
              <p className={styles.speech} aria-live="polite">
                “{speak(info)}”
              </p>
              <dl className={styles.facts}>
                <div>
                  <dt>Role</dt>
                  <dd>{info.role}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd data-missing={(!info.name && needsName(info.role)) || undefined}>
                    {info.name || 'none'}
                  </dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{info.description || 'none'}</dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd>{info.states.join(', ') || 'none'}</dd>
                </div>
              </dl>
            </>
          )}
          {widget.behavior === 'status' && (
            <ol className={styles.log} aria-label="Status changes">
              {log.length === 0 && (
                <li className={styles.empty}>Press the button to change the status.</li>
              )}
              {log.map((a) => (
                <li key={a.id} data-heard={a.heard || undefined}>
                  {a.heard ? 'Announced: ' : 'Silent: '}
                  {a.heard ? a.text : 'the text changed, but nothing tells a screen reader.'}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
