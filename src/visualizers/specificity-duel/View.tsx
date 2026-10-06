import { ArrowDownUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/Button.tsx';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import type { Specificity } from '../shared/css/specificity.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { SpecificityDuelProps } from './build.ts';
import { decide, ruleSpecificity, type Contender, type Decider } from './model.ts';
import styles from './View.module.css';

interface RuleState {
  selector: string;
  important: boolean;
}

const COLUMN: Partial<Record<Decider, number>> = { ids: 0, classes: 1, types: 2 };

function matchesTarget(body: Element, selector: string): boolean | null {
  const target = body.querySelector('[data-target]');
  if (!target) return null;
  try {
    return target.matches(selector);
  } catch {
    return null;
  }
}

function Score({ value, decisive }: { value: Specificity; decisive?: number }) {
  const labels = ['IDs', 'classes', 'types'];
  return (
    <div className={styles.score} aria-label={`Specificity ${value.join(', ')}`}>
      {value.map((n, k) => (
        <span key={k} className={styles.column} data-decisive={k === decisive || undefined}>
          <span className={styles.number}>{n}</span>
          <span className={styles.columnLabel}>{labels[k]}</span>
        </span>
      ))}
    </div>
  );
}

export default function SpecificityDuelView({ props }: VisualizerViewProps<SpecificityDuelProps>) {
  const [rules, setRules] = useState<RuleState[]>(
    props.rules.map((r) => ({ selector: r.selector, important: r.important })),
  );
  const [swapped, setSwapped] = useState(false);
  const [inlineOn, setInlineOn] = useState(false);
  const [inlineImportant, setInlineImportant] = useState(false);
  const [rendered, setRendered] = useState('');

  const body = new DOMParser().parseFromString(props.html, 'text/html').body;
  // Sheet order: A then B, unless swapped.
  const order = swapped ? [1, 0] : [0, 1];
  const target = body.querySelector('[data-target]');
  const cards = rules.map((rule, i) => {
    const paint = props.rules[i]?.color ?? { value: 'currentColor', name: '?' };
    const matches = matchesTarget(body, rule.selector);
    const spec = ruleSpecificity(rule.selector, (complex) => {
      try {
        return target?.matches(complex) ?? false;
      } catch {
        return false;
      }
    });
    return { ...rule, paint, matches, spec, order: order.indexOf(i) };
  });

  const contenders: (Contender & { card: number })[] = cards.flatMap((c, i) =>
    c.matches
      ? [
          {
            label: `Rule ${'AB'[i]}`,
            specificity: c.spec,
            important: c.important,
            order: c.order,
            card: i,
          },
        ]
      : [],
  );
  if (inlineOn) {
    contenders.push({
      label: 'the style attribute',
      specificity: null,
      important: inlineImportant,
      order: 9,
      card: 2,
    });
  }
  const verdict = decide(contenders);
  const winner = verdict ? contenders[verdict.winner] : undefined;
  const winnerPaint =
    winner?.card === 2 ? props.inline : winner ? cards[winner.card]?.paint : undefined;

  const sheet = order
    .map((i) => {
      const c = cards[i];
      if (!c || c.matches === null) return '';
      return `${c.selector} { color: ${c.paint.value}${c.important ? ' !important' : ''}; }`;
    })
    .join('\n');
  const html = inlineOn
    ? props.html.replace(
        'data-target',
        `data-target style="color: ${props.inline.value}${inlineImportant ? ' !important' : ''}"`,
      )
    : props.html;
  const browserAgrees = rendered && winnerPaint ? sameColor(rendered, winnerPaint.value) : null;

  return (
    <div className={styles.frame}>
      <div className={styles.rules}>
        {order.map((i, position) => {
          const card = cards[i];
          if (!card) return null;
          const isWinner = winner?.card === i;
          return (
            <section
              key={i}
              className={styles.card}
              data-winner={isWinner || undefined}
              aria-label={`Rule ${'AB'[i]}`}
              style={{ ['--paint' as string]: card.paint.value }}
            >
              <div className={styles.cardHead}>
                <h3>
                  Rule {'AB'[i]} <span className={styles.line}>line {position + 1}</span>
                </h3>
                {isWinner && <span className={styles.wins}>wins</span>}
              </div>
              <label className={styles.selector}>
                <span className="visually-hidden">Selector of rule {'AB'[i]}</span>
                <input
                  value={card.selector}
                  list={`picks-${i}`}
                  spellCheck={false}
                  onChange={(event) =>
                    setRules((all) =>
                      all.map((r, k) => (k === i ? { ...r, selector: event.target.value } : r)),
                    )
                  }
                />
              </label>
              <datalist id={`picks-${i}`}>
                {props.picks.map((pick) => (
                  <option key={pick} value={pick} />
                ))}
              </datalist>
              <code className={styles.declaration}>
                {'{ color: '}
                <span className={styles.swatch} aria-hidden="true" />
                {card.paint.name}
                {card.important ? ' !important' : ''}
                {'; }'}
              </code>
              {card.matches === null ? (
                <p className={styles.note}>Not a valid selector: the rule is dropped.</p>
              ) : card.matches ? (
                <Score
                  value={card.spec}
                  decisive={isWinner ? COLUMN[verdict?.decider ?? 'only'] : undefined}
                />
              ) : (
                <p className={styles.note}>Doesn’t match the button, so it never competes.</p>
              )}
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={card.important}
                  onChange={(event) =>
                    setRules((all) =>
                      all.map((r, k) => (k === i ? { ...r, important: event.target.checked } : r)),
                    )
                  }
                />
                !important
              </label>
            </section>
          );
        })}
      </div>

      <div className={styles.controls}>
        <Button size="sm" icon={<ArrowDownUp />} onClick={() => setSwapped((s) => !s)}>
          Swap the order of A and B
        </Button>
        <Toggle
          label={`Inline style="color: ${props.inline.name}"`}
          checked={inlineOn}
          onChange={setInlineOn}
        />
        {inlineOn && (
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={inlineImportant}
              onChange={(event) => setInlineImportant(event.target.checked)}
            />
            inline !important
          </label>
        )}
      </div>

      <div className={styles.result}>
        <ShadowStage
          html={html}
          css={`
            ${props.css}\n${sheet}
          `}
          className={styles.stage}
          inert
          onRender={(root) => {
            const target = root.querySelector('[data-target]');
            const color = target ? getComputedStyle(target).color : '';
            setRendered((current) => (current === color ? current : color));
          }}
        />
        <div className={styles.verdict} aria-live="polite">
          <p className={styles.verdictTitle}>
            {winnerPaint ? `The button is ${winnerPaint.name}.` : 'No rule matches the button.'}
          </p>
          {verdict && <p>{verdict.explanation}</p>}
          {browserAgrees !== null && (
            <p className={styles.agree}>
              {browserAgrees
                ? 'The browser renders exactly that.'
                : 'The browser disagrees: check the selectors.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Compares a computed rgb() colour with an authored hex colour. */
function sameColor(computed: string, authored: string): boolean {
  const hex = /^#([0-9a-f]{6})$/i.exec(authored)?.[1];
  if (!hex) return true;
  const rgb = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16));
  return computed.replace(/\s/g, '') === `rgb(${rgb.join(',')})`;
}
