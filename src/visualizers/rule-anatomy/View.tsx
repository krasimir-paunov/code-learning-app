import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/Button.tsx';
import { IconButton } from '../../components/IconButton.tsx';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { RuleAnatomyProps } from './build.ts';
import { checkRule, stageCss, STATUS_TEXT, type BrowserChecks, type Declaration } from './model.ts';
import styles from './View.module.css';

const BROWSER: BrowserChecks = {
  supports: (property, value) => CSS.supports(property, value),
  parses: (selector) => {
    try {
      document.createDocumentFragment().querySelector(selector);
      return true;
    } catch {
      return false;
    }
  },
};

export default function RuleAnatomyView({ props }: VisualizerViewProps<RuleAnatomyProps>) {
  const first = props.presets[0]?.rule ?? { selector: 'p', declarations: [] };
  const [preset, setPreset] = useState('0');
  const [selector, setSelector] = useState(first.selector);
  const [declarations, setDeclarations] = useState<Declaration[]>(first.declarations);
  const [matches, setMatches] = useState<number | null>(null);
  const report = checkRule(selector, declarations, BROWSER);
  const css = `${props.baseCss}\n${stageCss(report, selector)}`;

  const edit = (index: number, patch: Partial<Declaration>) =>
    setDeclarations((all) => all.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  return (
    <div className={styles.frame}>
      {props.presets.length > 1 && (
        <SegmentedControl
          label="Start from"
          size="sm"
          options={props.presets.map((p, i) => ({ value: String(i), label: p.label }))}
          value={preset}
          onChange={(value) => {
            const rule = props.presets[Number(value)]?.rule;
            setPreset(value);
            if (!rule) return;
            setSelector(rule.selector);
            setDeclarations(rule.declarations);
          }}
        />
      )}
      <div className={styles.lab}>
        <div className={styles.builder}>
          <div className={styles.rule} role="group" aria-label="The rule">
            <span className={styles.head}>
              <span className={styles.selectorPart} data-part="selector">
                <input
                  className={styles.inline}
                  value={selector}
                  onChange={(event) => setSelector(event.target.value)}
                  aria-label="Selector"
                  size={Math.max(4, selector.length)}
                  spellCheck={false}
                />
              </span>{' '}
              <span className={styles.brace}>{'{'}</span>
            </span>
            {declarations.map((d, i) => {
              const status = report.declarations[i]?.status ?? 'empty';
              return (
                <span key={i} className={styles.declaration} data-status={status}>
                  {'  '}
                  <input
                    className={styles.inline}
                    data-part="property"
                    value={d.property}
                    onChange={(event) => edit(i, { property: event.target.value })}
                    aria-label={`Property ${i + 1}`}
                    size={Math.max(5, d.property.length)}
                    spellCheck={false}
                  />
                  <span className={styles.punct}>: </span>
                  <input
                    className={styles.inline}
                    data-part="value"
                    value={d.value}
                    onChange={(event) => edit(i, { value: event.target.value })}
                    aria-label={`Value ${i + 1}`}
                    size={Math.max(5, d.value.length)}
                    spellCheck={false}
                  />
                  <span className={styles.punct}>;</span>
                  <IconButton
                    label={`Remove declaration ${i + 1}`}
                    icon={<Trash2 />}
                    onClick={() => setDeclarations((all) => all.filter((_, k) => k !== i))}
                  />
                  <span className={styles.status}>{STATUS_TEXT[status]}</span>
                </span>
              );
            })}
            <span className={styles.brace}>{'}'}</span>
          </div>
          <Button
            size="sm"
            icon={<Plus />}
            onClick={() => setDeclarations((all) => [...all, { property: '', value: '' }])}
            disabled={declarations.length >= 6}
          >
            Add declaration
          </Button>
          <ul className={styles.legend} aria-label="Parts of a rule">
            <li data-part="selector">selector: which elements</li>
            <li data-part="property">property: what to change</li>
            <li data-part="value">value: to what</li>
          </ul>
        </div>

        <div className={styles.result}>
          <ShadowStage
            html={props.html}
            css={css}
            className={styles.stage}
            onRender={(root) => {
              let count: number | null = null;
              if (report.selectorValid) {
                const content = root.querySelector('[part="content"]');
                count = content ? content.querySelectorAll(selector).length : 0;
              }
              setMatches((current) => (current === count ? current : count));
            }}
            inert
          />
          <p className={styles.summary} aria-live="polite">
            {!report.selectorValid
              ? 'The selector doesn’t parse, so the browser ignores the whole rule.'
              : matches === 0
                ? 'The selector is valid but matches nothing on this page.'
                : `The selector matches ${matches} ${matches === 1 ? 'element' : 'elements'} (outlined).`}
          </p>
        </div>
      </div>
    </div>
  );
}
