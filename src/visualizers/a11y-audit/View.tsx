import { Check, Eye, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { accessibleName } from '../shared/a11y/a11y.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { A11yAuditProps } from './build.ts';
import { textContrast } from './model.ts';
import styles from './View.module.css';

type View = 'normal' | 'grayscale';

interface Finding {
  pass: boolean | null;
  detail: string;
}

const PAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  .page { padding: 16px; background: #fff; font: 15px/1.5 system-ui, sans-serif; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;

function audit(root: ShadowRoot, issues: A11yAuditProps['issues']): Finding[] {
  return issues.map(({ check }) => {
    if (check.kind === 'look') return { pass: null, detail: check.how };
    const el = root.querySelector(check.selector);
    if (!el) return { pass: false, detail: 'not found' };
    if (check.kind === 'name') {
      const name = accessibleName(el);
      return name
        ? { pass: true, detail: `name: “${name}”` }
        : { pass: false, detail: 'no accessible name' };
    }
    const backgrounds: string[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) {
      backgrounds.push(getComputedStyle(node).backgroundColor);
    }
    const ratio = textContrast(getComputedStyle(el).color, backgrounds);
    if (ratio === null) return { pass: null, detail: 'could not measure' };
    const shown = `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
    return { pass: ratio >= check.min, detail: `${shown}, needs ${check.min}:1` };
  });
}

export default function A11yAuditView({ props }: VisualizerViewProps<A11yAuditProps>) {
  const [fixed, setFixed] = useState<Set<number>>(() => new Set());
  const [view, setView] = useState<View>('normal');
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);

  const css = [
    PAGE_CSS,
    props.css,
    ...props.issues.flatMap((issue, i) => (fixed.has(i) ? [issue.fix] : [])),
    view === 'grayscale' ? '.page { filter: grayscale(1); }' : '',
  ].join('\n');

  return (
    <div className={styles.frame}>
      <div className={styles.controls}>
        <SegmentedControl<View>
          label="View"
          size="sm"
          options={[
            { value: 'normal', label: 'normal' },
            { value: 'grayscale', label: 'without colour' },
          ]}
          value={view}
          onChange={setView}
        />
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            const target = root?.querySelector<HTMLElement>(props.focusTarget);
            target?.focus({ focusVisible: true } as FocusOptions);
          }}
        >
          <Eye aria-hidden="true" /> Move keyboard focus to the button
        </button>
      </div>

      <div className={styles.layout}>
        {/* The page fails on purpose until the learner fixes it. */}
        <div data-a11y-demo className={styles.stage}>
          <ShadowStage
            html={`<div class="page">${props.html}</div>`}
            css={css}
            label="The page"
            noNavigation
            onRender={(r) => {
              setRoot((c) => (c === r ? c : r));
              const next = audit(r, props.issues);
              setFindings((f) => (JSON.stringify(f) === JSON.stringify(next) ? f : next));
            }}
          />
        </div>

        <section className={styles.panel} aria-label="Audit">
          <h3 className={styles.title}>Audit</h3>
          <ul className={styles.issues} aria-live="polite">
            {props.issues.map((issue, i) => {
              const finding = findings[i];
              const ok = fixed.has(i) && finding?.pass !== false;
              return (
                <li key={issue.title} data-ok={ok || undefined}>
                  <label className={styles.issue}>
                    <input
                      type="checkbox"
                      checked={fixed.has(i)}
                      onChange={(e) =>
                        setFixed((s) => {
                          const next = new Set(s);
                          if (e.target.checked) next.add(i);
                          else next.delete(i);
                          return next;
                        })
                      }
                    />
                    <strong>{issue.title}</strong>
                    <span className={styles.fixLabel}>apply the fix</span>
                  </label>
                  <p className={styles.finding}>
                    {finding?.pass === true && <Check aria-hidden="true" />}
                    {finding?.pass === false && <TriangleAlert aria-hidden="true" />}
                    <span>
                      {finding?.pass === true
                        ? 'Passes: '
                        : finding?.pass === false
                          ? 'Fails: '
                          : 'Check it: '}
                      {finding?.detail}
                    </span>
                  </p>
                  {fixed.has(i) && (
                    <pre className={styles.code}>
                      <code>{issue.fix.trim()}</code>
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
