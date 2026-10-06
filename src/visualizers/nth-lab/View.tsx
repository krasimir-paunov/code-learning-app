import { useState, type FocusEvent, type PointerEvent } from 'react';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { NthLabProps } from './build.ts';
import { parseFormula, table } from './model.ts';
import styles from './View.module.css';

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

/** Which state pseudo-classes match a real button right now. */
function StateStrip() {
  const [states, setStates] = useState({
    hover: false,
    focusVisible: false,
    active: false,
    focus: false,
  });
  const set = (patch: Partial<typeof states>) => setStates((s) => ({ ...s, ...patch }));
  const handlers = {
    onPointerEnter: () => set({ hover: true }),
    onPointerLeave: () => set({ hover: false, active: false }),
    onPointerDown: () => set({ active: true }),
    onPointerUp: () => set({ active: false }),
    onFocus: (event: FocusEvent<HTMLButtonElement>) =>
      set({ focus: true, focusVisible: event.currentTarget.matches(':focus-visible') }),
    onBlur: () => set({ focus: false, focusVisible: false }),
    onKeyDown: (event: { key: string; currentTarget: HTMLButtonElement }) => {
      if (event.key === 'Tab') return;
      set({ focusVisible: event.currentTarget.matches(':focus-visible') });
    },
  };
  const matching = [
    states.hover && ':hover',
    states.active && ':active',
    states.focus && ':focus',
    states.focusVisible && ':focus-visible',
  ].filter(Boolean);
  return (
    <section className={styles.states} aria-label="States">
      <h3 className={styles.title}>States: hover, click and Tab to the button</h3>
      <div className={styles.stateRow}>
        <button
          type="button"
          className={styles.demoButton}
          {...handlers}
          onPointerUp={(event: PointerEvent<HTMLButtonElement>) => {
            handlers.onPointerUp();
            // A mouse click focuses the button without :focus-visible; read it again.
            set({ focusVisible: event.currentTarget.matches(':focus-visible') });
          }}
        >
          Add to cart
        </button>
        <p className={styles.matching} aria-live="polite">
          Matching now: {matching.length ? <code>{matching.join(' ')}</code> : 'none'}
        </p>
      </div>
    </section>
  );
}

export default function NthLabView({ props }: VisualizerViewProps<NthLabProps>) {
  const [text, setText] = useState(props.picks[0] ?? 'odd');
  const [skipSoldOut, setSkipSoldOut] = useState(false);
  const [labels, setLabels] = useState(false);
  const formula = parseFormula(text);
  const selector = `li:nth-child(${text.trim()})${skipSoldOut ? ':not(.sold-out)' : ''}`;
  const html = `<ol>${props.items
    .map((item) => `<li${item.soldOut ? ' class="sold-out"' : ''}>${escape(item.label)}</li>`)
    .join('')}</ol>`;
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  let matched: number[] = [];
  if (formula) {
    const items = Array.from(body.querySelectorAll('li'));
    try {
      matched = Array.from(body.querySelectorAll(selector)).map(
        (li) => items.indexOf(li as HTMLLIElement) + 1,
      );
    } catch {
      matched = [];
    }
  }
  const css = [
    'ol { margin: 0; padding-left: 2.2em; } li { padding: 2px 6px; border-radius: 4px; }',
    '.sold-out { color: var(--text-3); text-decoration: line-through; }',
    formula
      ? `${selector} { background: color-mix(in oklch, var(--accent) 28%, transparent); outline: 2px solid var(--accent); }`
      : '',
    labels
      ? 'li.sold-out::after { content: " (sold out)"; font-style: italic; text-decoration: none; display: inline-block; margin-left: 4px; }'
      : '',
  ].join('\n');

  return (
    <div className={styles.frame}>
      <label className={styles.field}>
        <span className={styles.prefix}>li:nth-child(</span>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Formula inside :nth-child()"
          spellCheck={false}
        />
        <span className={styles.prefix}>)</span>
      </label>
      <div className={styles.picks} role="group" aria-label="Try these formulas">
        {props.picks.map((pick) => (
          <button
            key={pick}
            type="button"
            className={styles.pick}
            aria-pressed={pick === text}
            onClick={() => setText(pick)}
          >
            {pick}
          </button>
        ))}
      </div>
      <div className={styles.toggles}>
        <Toggle label="Add :not(.sold-out)" checked={skipSoldOut} onChange={setSkipSoldOut} />
        <Toggle
          label='Add li.sold-out::after { content: " (sold out)" }'
          checked={labels}
          onChange={setLabels}
        />
      </div>

      <div className={styles.lab}>
        <section className={styles.panel} aria-label="List">
          <h3 className={styles.title}>
            <code>{selector}</code>
          </h3>
          <ShadowStage html={html} css={css} className={styles.stage} inert />
          <p className={styles.summary} aria-live="polite">
            {formula
              ? `Selects ${matched.length ? `items ${matched.join(', ')}` : 'nothing'}.`
              : 'Not a valid An+B formula (try 2n+1, odd or -n+3).'}
          </p>
        </section>
        {formula && (
          <section className={styles.panel} aria-label="How the formula counts">
            <h3 className={styles.title}>
              n = 0, 1, 2… into {formula.a}n {formula.b < 0 ? '−' : '+'} {Math.abs(formula.b)}
            </h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">n</th>
                  <th scope="col">value</th>
                  <th scope="col">item?</th>
                </tr>
              </thead>
              <tbody>
                {table(formula, props.items.length).map((row) => (
                  <tr key={row.n} data-hit={row.selects || undefined}>
                    <td>{row.n}</td>
                    <td>{row.value}</td>
                    <td>{row.selects ? `item ${row.value}` : 'no such item'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
      <StateStrip />
    </div>
  );
}
