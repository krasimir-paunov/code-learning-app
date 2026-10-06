import { Crosshair, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Button } from '../../components/Button.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { parseRules } from '../shared/css/rules.ts';
import { formatSpecificity } from '../shared/css/specificity.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { DevtoolsSimProps } from './build.ts';
import { elementLabel, keyOf, matchedRules, type DeclarationKey } from './model.ts';
import styles from './View.module.css';

interface Box {
  label: string;
  size: string;
  margin: CSSProperties;
  border: CSSProperties;
  content: CSSProperties;
}

/** A live DOM edit, like typing into the Elements panel. */
function setText(element: Element, text: string) {
  element.textContent = text;
}

/** DevTools-style highlight boxes for `element`, relative to `frame`. */
function measure(element: Element, frame: Element): Box {
  const rect = element.getBoundingClientRect();
  const origin = frame.getBoundingClientRect();
  const cs = getComputedStyle(element);
  const px = (p: string) => parseFloat(cs.getPropertyValue(p)) || 0;
  const [mt, mr, mb, ml] = ['top', 'right', 'bottom', 'left'].map((s) => px(`margin-${s}`));
  const [pt, pr, pb, pl] = ['top', 'right', 'bottom', 'left'].map((s) => px(`padding-${s}`));
  const [bt, br, bb, bl] = ['top', 'right', 'bottom', 'left'].map((s) => px(`border-${s}-width`));
  const left = rect.left - origin.left;
  const top = rect.top - origin.top;
  return {
    label: elementLabel(element),
    size: `${Math.round(rect.width)} × ${Math.round(rect.height)}`,
    margin: {
      left: left - (ml ?? 0),
      top: top - (mt ?? 0),
      width: rect.width + (ml ?? 0) + (mr ?? 0),
      height: rect.height + (mt ?? 0) + (mb ?? 0),
    },
    border: { left, top, width: rect.width, height: rect.height },
    content: {
      left: left + (bl ?? 0) + (pl ?? 0),
      top: top + (bt ?? 0) + (pt ?? 0),
      width: rect.width - (bl ?? 0) - (br ?? 0) - (pl ?? 0) - (pr ?? 0),
      height: rect.height - (bt ?? 0) - (bb ?? 0) - (pt ?? 0) - (pb ?? 0),
    },
  };
}

function TreeRows({
  element,
  selected,
  onSelect,
}: {
  element: Element;
  selected: Element | null;
  onSelect: (element: Element) => void;
}) {
  'use no memo'; // Reads the live (mutable) DOM while rendering.
  return (
    <ul className={styles.tree}>
      {Array.from(element.childNodes).map((node, i) => {
        if (node.nodeType === 3) {
          const text = node.textContent?.trim();
          return text ? (
            <li key={i} className={styles.textNode}>
              "{text}"
            </li>
          ) : null;
        }
        if (node.nodeType !== 1) return null;
        const child = node as Element;
        return (
          <li key={i}>
            <button
              type="button"
              className={styles.node}
              aria-current={child === selected ? 'true' : undefined}
              onClick={() => onSelect(child)}
            >
              <span className={styles.tag}>&lt;{child.localName}</span>
              {Array.from(child.attributes).map((a) => (
                <span key={a.name} className={styles.attr}>
                  {' '}
                  {a.name}=<span className={styles.value}>"{a.value}"</span>
                </span>
              ))}
              <span className={styles.tag}>&gt;</span>
            </button>
            {child.childNodes.length > 0 && (
              <TreeRows element={child} selected={selected} onSelect={onSelect} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Simulator({ props, onEdit }: { props: DevtoolsSimProps; onEdit: () => void }) {
  // The page's DOM and styles change outside React (live edits), so nothing here may be
  // memoized: every render re-reads the DOM, like DevTools does.
  'use no memo';
  const rules = parseRules(props.css);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [selected, setSelected] = useState<Element | null>(null);
  const [hovered, setHovered] = useState<Element | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [values, setValues] = useState(new Map<DeclarationKey, string>());
  const [disabled, setDisabled] = useState(new Set<DeclarationKey>());
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const content = root?.querySelector('[part="content"]') ?? null;
  const sheet = (root?.querySelector('style[data-authored]') as HTMLStyleElement | null)?.sheet;

  const onRender = useCallback((shadow: ShadowRoot) => {
    setRoot((current) => current ?? shadow);
  }, []);

  // Inspect mode: hovering highlights, clicking selects (and never activates the page).
  useEffect(() => {
    if (!root || !inspecting) return;
    const target = (event: Event) => {
      const el = event.target as Element | null;
      return el && el !== content && content?.contains(el) ? el : null;
    };
    const move = (event: Event) => setHovered(target(event));
    const click = (event: Event) => {
      const el = target(event);
      if (!el) return;
      event.preventDefault();
      setSelected(el);
      setInspecting(false);
      setHovered(null);
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('click', click, true);
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('click', click, true);
    };
  }, [root, inspecting, content]);

  useEffect(() => {
    if (!frame) return;
    const observer = new ResizeObserver(refresh);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame, refresh]);

  const cssRule = (index: number) => sheet?.cssRules[index] as CSSStyleRule | undefined;
  const editValue = (index: number, property: string, value: string) => {
    cssRule(index)?.style.setProperty(property, value);
    setValues((m) => new Map(m).set(keyOf(index, property), value));
    onEdit();
  };
  const toggle = (index: number, property: string, value: string, on: boolean) => {
    const key = keyOf(index, property);
    if (on) cssRule(index)?.style.setProperty(property, value);
    else cssRule(index)?.style.removeProperty(property);
    setDisabled((s) => {
      const next = new Set(s);
      if (on) next.delete(key);
      else next.add(key);
      return next;
    });
    onEdit();
  };

  const highlight = hovered ?? selected;
  const box = highlight && frame ? measure(highlight, frame) : null;
  const matched = selected ? matchedRules(selected, rules, values, disabled) : [];
  const onlyText =
    selected && selected.children.length === 0 && selected.childNodes.length > 0
      ? selected.textContent
      : null;

  return (
    <div className={styles.layout}>
      <div className={styles.browser}>
        <div className={styles.address}>
          <span className={styles.url}>{props.url}</span>
        </div>
        <div className={styles.frame} ref={setFrame} data-inspecting={inspecting || undefined}>
          <ShadowStage html={props.html} css={props.css} onRender={onRender} inert />
          {box && (
            <div className={styles.overlay} aria-hidden="true">
              <div className={styles.marginBox} style={box.margin} />
              <div className={styles.borderBox} style={box.border} />
              <div className={styles.contentBox} style={box.content} />
              <div
                className={styles.tooltip}
                style={{
                  left: box.border.left,
                  top: Math.max(0, Number(box.margin.top) + Number(box.margin.height) + 4),
                }}
              >
                <strong>{box.label}</strong> {box.size}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.devtools}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.inspect}
            aria-pressed={inspecting}
            onClick={() => setInspecting((on) => !on)}
          >
            <Crosshair aria-hidden="true" /> Select an element in the page
          </button>
        </div>

        <div className={styles.panes}>
          <section className={styles.pane} aria-label="Elements">
            <h3 className={styles.paneTitle}>Elements</h3>
            {content && <TreeRows element={content} selected={selected} onSelect={setSelected} />}
          </section>

          <section className={styles.pane} aria-label="Styles" aria-live="polite">
            <h3 className={styles.paneTitle}>Styles</h3>
            {!selected && <p className={styles.empty}>Select an element to see its rules.</p>}
            {selected && (
              <>
                <p className={styles.selection}>
                  <code>{elementLabel(selected)}</code>
                </p>
                {onlyText !== null && (
                  <label className={styles.field}>
                    <span>Text</span>
                    <input
                      value={onlyText ?? ''}
                      onChange={(event) => {
                        setText(selected, event.target.value);
                        onEdit();
                        refresh();
                      }}
                    />
                  </label>
                )}
                {matched.length === 0 && <p className={styles.empty}>No rules match it.</p>}
                {matched.map((rule) => (
                  <div key={rule.index} className={styles.rule}>
                    <p className={styles.selector}>
                      <code>{rule.selector}</code>
                      <span className={styles.spec} title="Specificity">
                        {formatSpecificity(rule.specificity)}
                      </span>
                    </p>
                    {rule.declarations.map((d) => (
                      <div
                        key={d.property}
                        className={styles.declaration}
                        data-overridden={d.overridden || undefined}
                        data-disabled={!d.enabled || undefined}
                      >
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          aria-label={`Apply ${d.property} in ${rule.selector}`}
                          onChange={(event) =>
                            toggle(rule.index, d.property, d.value, event.target.checked)
                          }
                        />
                        <span className={styles.property}>{d.property}</span>:
                        <input
                          className={styles.valueInput}
                          value={d.value}
                          aria-label={`${d.property} value in ${rule.selector}`}
                          size={Math.max(4, d.value.length)}
                          onChange={(event) =>
                            editValue(rule.index, d.property, event.target.value)
                          }
                        />
                        {d.overridden && <span className={styles.note}>overridden</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function DevtoolsSimView({ props }: VisualizerViewProps<DevtoolsSimProps>) {
  const [loads, setLoads] = useState(0);
  const [edited, setEdited] = useState(false);
  return (
    <div className={styles.sim}>
      <Simulator key={loads} props={props} onEdit={() => setEdited(true)} />
      <div className={styles.status}>
        <p aria-live="polite">
          {edited
            ? 'You have live edits. They exist only in this tab: the files on the server never changed.'
            : loads > 0
              ? 'Reloaded: the page is exactly what the server sent. Every edit is gone.'
              : 'Nothing edited yet.'}
        </p>
        <Button
          size="sm"
          icon={<RotateCw />}
          onClick={() => {
            setLoads((n) => n + 1);
            setEdited(false);
          }}
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}
