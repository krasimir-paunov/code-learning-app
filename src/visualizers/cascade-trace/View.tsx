import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { parseRules } from '../shared/css/rules.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { CascadeTraceProps } from './build.ts';
import { INHERITED, KEYWORDS, traceValue, type Keyword, type Step } from './model.ts';
import styles from './View.module.css';

const TARGET_ID = 'trace-target';

interface Row {
  label: string;
  computed: string;
  text: string;
  kind: Step['kind'];
}

interface Report {
  label: string;
  computed: string;
  rows: Row[];
}

function labelOf(element: Element): string {
  const classes = Array.from(element.classList, (c) => `.${c}`).join('');
  return `${element.localName}${classes}`;
}

function rowText(step: Step, property: string): string {
  switch (step.kind) {
    case 'declared':
      return `${step.selector} { ${property}: ${step.value} } sets it here.`;
    case 'keyword':
      return `${property}: ${step.keyword} on this element.`;
    case 'passes':
      return `No ${property} of its own, so it inherits from its parent.`;
    case 'browser':
      return `The browser's own stylesheet sets ${property} on <${step.element.localName}>, so nothing is inherited here.`;
    case 'not-inherited':
      return `${property} doesn't inherit, and no rule sets it here: the initial value.`;
    case 'initial':
      return `The property's initial value, its default in the CSS specification.`;
  }
}

/** Follows child indices from the content root to an element. */
function at(root: Element, path: readonly number[]): Element {
  return path.reduce<Element>((el, i) => el.children[i] ?? el, root);
}

function TreeButtons({
  element,
  path,
  selected,
  onSelect,
}: {
  element: Element;
  path: number[];
  selected: string;
  onSelect: (path: number[]) => void;
}) {
  return (
    <ul className={styles.tree}>
      {Array.from(element.children).map((child, i) => {
        const childPath = [...path, i];
        return (
          <li key={i}>
            <button
              type="button"
              className={styles.node}
              aria-pressed={childPath.join() === selected}
              onClick={() => onSelect(childPath)}
            >
              {labelOf(child)}
            </button>
            {child.children.length > 0 && (
              <TreeButtons
                element={child}
                path={childPath}
                selected={selected}
                onSelect={onSelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function CascadeTraceView({ props }: VisualizerViewProps<CascadeTraceProps>) {
  const [path, setPath] = useState<number[]>(props.start);
  const [property, setProperty] = useState(props.properties[0] ?? 'color');
  const [keyword, setKeyword] = useState<Keyword | 'none'>('none');
  const [report, setReport] = useState<Report | null>(null);
  const extra = keyword === 'none' ? '' : `#${TARGET_ID} { ${property}: ${keyword}; }`;
  const css = `${props.css}\n${extra}`;
  // A plain light page with the browser's own text and link colours: the stage's theme
  // colours would hide what the browser's stylesheet does.
  const pageCss =
    ':host { color: CanvasText; background: Canvas; color-scheme: light; } a { color: revert; }';
  const tree = new DOMParser().parseFromString(props.html, 'text/html').body;

  const analyse = (root: ShadowRoot) => {
    const content = root.querySelector('[part="content"]');
    const top = content?.firstElementChild;
    if (!content || !top) return;
    const target = at(content, path);
    content.querySelector(`#${TARGET_ID}`)?.removeAttribute('id');
    target.id = TARGET_ID;
    const steps = traceValue(target, top, parseRules(css), property);
    const next: Report = {
      label: labelOf(target),
      computed: getComputedStyle(target).getPropertyValue(property),
      rows: steps.map((step) => ({
        label: labelOf(step.element),
        computed: getComputedStyle(step.element).getPropertyValue(property),
        text: rowText(step, property),
        kind: step.kind,
      })),
    };
    setReport((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
  };

  return (
    <div className={styles.frame}>
      <div className={styles.controls}>
        <SegmentedControl
          label="Property"
          size="sm"
          options={props.properties.map((p) => ({
            value: p,
            label: `${p}${INHERITED.has(p) ? '' : ' *'}`,
          }))}
          value={property}
          onChange={(p) => {
            setProperty(p);
            setKeyword('none');
          }}
        />
        <p className={styles.footnote}>* doesn’t inherit</p>
      </div>
      <div className={styles.lab}>
        <section className={styles.panel} aria-label="Elements">
          <h3 className={styles.title}>Pick an element</h3>
          <TreeButtons
            element={tree}
            path={[]}
            selected={path.join()}
            onSelect={(p) => {
              setPath(p);
              setKeyword('none');
            }}
          />
        </section>
        <section className={styles.panel} aria-label="Page">
          <h3 className={styles.title}>Page</h3>
          <ShadowStage
            html={props.html}
            css={`
              ${pageCss}\n${css}\n#${TARGET_ID} {
                outline: 2px dashed var(--accent);
                outline-offset: 3px;
              }
            `}
            className={styles.stage}
            onRender={analyse}
            inert
          />
        </section>
      </div>

      {report && (
        <section
          className={styles.trace}
          aria-live="polite"
          aria-label="Where the value comes from"
        >
          <p className={styles.headline}>
            <code>{report.label}</code> {property}: <strong>{report.computed}</strong>
          </p>
          <ol className={styles.steps}>
            {report.rows.map((row, i) => (
              <li key={i} data-kind={row.kind}>
                {i > 0 && <ArrowUp aria-hidden="true" className={styles.arrow} />}
                <span className={styles.stepHead}>
                  <code>{row.label}</code> <span className={styles.value}>{row.computed}</span>
                </span>
                <span className={styles.stepText}>{row.text}</span>
              </li>
            ))}
          </ol>
          <SegmentedControl<Keyword | 'none'>
            label={`Set ${property} on ${report.label} to a keyword`}
            size="sm"
            options={[
              { value: 'none', label: 'nothing' },
              ...KEYWORDS.map((k) => ({ value: k, label: k })),
            ]}
            value={keyword}
            onChange={setKeyword}
          />
        </section>
      )}
    </div>
  );
}
