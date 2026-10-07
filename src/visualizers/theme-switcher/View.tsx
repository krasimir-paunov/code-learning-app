import { useId, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { ThemeSwitcherProps } from './build.ts';
import { describeSource, fallbacks, resolveVar, rulesCss, type VarRule } from './model.ts';
import styles from './View.module.css';

interface Measured {
  /** For the inspected element, then each ancestor: indexes of the rules that match it. */
  chain: number[][];
  /** Which rules match at least one element right now. */
  live: boolean[];
}

function withAttribute(html: string, selector: string, attribute: string, value: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelector(selector)?.setAttribute(attribute, value);
  return template.innerHTML;
}

function measure(root: ShadowRoot, rules: readonly VarRule[], target: string): Measured {
  const chain: number[][] = [];
  for (let el = root.querySelector(target); el; el = el.parentElement) {
    if (el.getAttribute('part') === 'content') break;
    chain.push(rules.flatMap((rule, i) => (el.matches(rule.selector) ? [i] : [])));
  }
  return { chain, live: rules.map((rule) => root.querySelector(rule.selector) !== null) };
}

export default function ThemeSwitcherView({ props }: VisualizerViewProps<ThemeSwitcherProps>) {
  const id = useId();
  const [rules, setRules] = useState<VarRule[]>(() =>
    props.rules.map((rule) => ({
      selector: rule.selector,
      declarations: rule.declarations.map((d) => ({ ...d, enabled: true })),
    })),
  );
  const [theme, setTheme] = useState(props.theme.values[0] ?? '');
  const [target, setTarget] = useState(props.targets[0]?.selector ?? '');
  const [measured, setMeasured] = useState<Measured>({ chain: [], live: [] });

  const toggle = (ruleIndex: number, declIndex: number, enabled: boolean) =>
    setRules((all) =>
      all.map((rule, i) =>
        i !== ruleIndex
          ? rule
          : {
              ...rule,
              declarations: rule.declarations.map((d, j) =>
                j === declIndex ? { ...d, enabled } : d,
              ),
            },
      ),
    );

  const html = withAttribute(props.html, props.theme.selector, props.theme.attribute, theme);
  const css = `${props.baseCss}\n${rulesCss(rules)}\n${props.usage}`;
  const used = fallbacks(props.usage);
  const targetLabel = props.targets.find((t) => t.selector === target)?.label ?? target;

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <div className={styles.column}>
          <ShadowStage
            html={html}
            css={css}
            className={styles.stage}
            inert
            onRender={(root) => {
              const next = measure(root, rules, target);
              setMeasured((m) => (JSON.stringify(m) === JSON.stringify(next) ? m : next));
            }}
          />
          <SegmentedControl
            label={props.theme.attribute}
            size="sm"
            options={props.theme.values.map((v) => ({ value: v, label: v }))}
            value={theme}
            onChange={setTheme}
          />
          <section className={styles.inspector} aria-labelledby={`${id}-inspect`}>
            <h3 id={`${id}-inspect`} className={styles.title}>
              Where do the values come from?
            </h3>
            <SegmentedControl
              label="Inspect"
              size="sm"
              options={props.targets.map((t) => ({ value: t.selector, label: t.label }))}
              value={target}
              onChange={setTarget}
            />
            <dl className={styles.trace} aria-live="polite">
              {[...used].map(([name, fallback]) => {
                const source = resolveVar(name, measured.chain, rules);
                return (
                  <div key={name} className={styles.traceRow} data-kind={source.kind}>
                    <dt>
                      <code>{name}</code>
                    </dt>
                    <dd>
                      <code className={styles.value}>
                        {source.kind === 'unset' ? (fallback ?? '—') : source.value}
                      </code>{' '}
                      <span className={styles.why}>{describeSource(source, fallback)}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className={styles.note}>
              Showing <strong>{targetLabel}</strong>. Custom properties inherit, so an element
              without its own value takes its parent’s.
            </p>
          </section>
        </div>

        <div className={styles.column}>
          {rules.map((rule, ruleIndex) => (
            <fieldset
              key={rule.selector}
              className={styles.rule}
              data-idle={measured.live[ruleIndex] === false || undefined}
            >
              <legend className={styles.selector}>
                <code>
                  {rule.selector} {'{'}
                </code>
                {measured.live[ruleIndex] === false && (
                  <span className={styles.idle}>matches nothing right now</span>
                )}
              </legend>
              {rule.declarations.map((d, declIndex) => (
                <label key={d.name} className={styles.declaration}>
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => toggle(ruleIndex, declIndex, e.target.checked)}
                  />
                  <code data-off={!d.enabled || undefined}>
                    {d.name}: {d.value};
                  </code>
                </label>
              ))}
              <code aria-hidden="true">{'}'}</code>
            </fieldset>
          ))}
          <figure className={styles.usage}>
            <figcaption className={styles.note}>Where they are used (read-only)</figcaption>
            <pre>
              <code>{props.usage.trim()}</code>
            </pre>
          </figure>
        </div>
      </div>
    </div>
  );
}
