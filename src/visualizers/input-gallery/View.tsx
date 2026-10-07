import { CalendarDays, Check } from 'lucide-react';
import { useId, useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import type { InputGalleryProps } from './build.ts';
import { INPUT_TYPES, keyboardFor, LAYOUTS, type InputType, type Keyboard } from './model.ts';
import styles from './View.module.css';

const KEYBOARD_TEXT: Record<Keyboard, string> = {
  letters: 'letters',
  email: 'letters with @ and . keys',
  url: 'letters with / and .com keys',
  search: 'letters with a Search key',
  tel: 'a phone keypad with + * #',
  digits: 'digits only',
  decimal: 'digits and a decimal point',
  picker: 'no keyboard: a date picker opens',
  none: 'no keyboard: tapping toggles it',
};

function PhoneKeyboard({ kind }: { kind: Keyboard }) {
  const rows = LAYOUTS[kind];
  return (
    <div className={styles.phone} aria-hidden="true">
      {rows ? (
        <div className={styles.keys} data-pad={rows[0]?.length === 3 || undefined}>
          {rows.map((row, r) => (
            <div key={r} className={styles.row}>
              {row.map((key, k) => (
                <span key={k} className={styles.key} data-wide={key.length > 1 || undefined}>
                  {key}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noKeys}>
          {kind === 'picker' && <CalendarDays />}
          {kind === 'picker' ? 'date picker' : 'no keyboard'}
        </p>
      )}
    </div>
  );
}

export default function InputGalleryView({ props }: VisualizerViewProps<InputGalleryProps>) {
  const id = useId();
  const [needIndex, setNeedIndex] = useState(0);
  const [type, setType] = useState<InputType>('text');
  const need = props.needs[needIndex] ?? props.needs[0];
  if (!need) return null;

  const isBest = type === need.best.type;
  // The recommended inputmode comes with the best type; other choices show the type's own keyboard.
  const keyboard = keyboardFor(type, isBest ? need.best.inputmode : undefined);
  const verdict = isBest
    ? need.why
    : (need.pitfalls[type] ??
      `It works, but it isn’t the best fit. The phone shows ${KEYBOARD_TEXT[keyboard]}.`);

  const best = need.best;
  const recommended = [
    `<input type="${best.type}"`,
    ` name="${need.name}"`,
    best.inputmode ? ` inputmode="${best.inputmode}"` : '',
    best.autocomplete ? ` autocomplete="${best.autocomplete}"` : '',
    best.attrs ? ` ${best.attrs}` : '',
    '>',
  ].join('');

  return (
    <div className={styles.frame}>
      <div className={styles.picker} role="group" aria-labelledby={`${id}-need`}>
        <p id={`${id}-need`} className={styles.label}>
          You are asking for…
        </p>
        <div className={styles.options}>
          {props.needs.map((n, i) => (
            <button
              key={n.label}
              type="button"
              className={styles.option}
              aria-pressed={i === needIndex}
              onClick={() => {
                setNeedIndex(i);
                setType('text');
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.picker} role="group" aria-labelledby={`${id}-type`}>
        <p id={`${id}-type`} className={styles.label}>
          …with <code>type=</code>
        </p>
        <div className={styles.options}>
          {INPUT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={styles.option}
              data-code
              aria-pressed={t === type}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.column}>
          <label className={styles.try}>
            <span>Try it: {need.label}</span>
            <input
              key={`${need.name}-${type}`}
              type={type}
              className={styles.input}
              inputMode={isBest ? need.best.inputmode : undefined}
              autoComplete="off"
            />
          </label>
          <div className={styles.verdict} data-best={isBest || undefined} aria-live="polite">
            {isBest && <Check aria-hidden="true" />}
            <p>
              <strong>{isBest ? 'Best fit. ' : 'Not the best fit. '}</strong>
              {verdict}
            </p>
          </div>
          <figure className={styles.code}>
            <figcaption>Recommended</figcaption>
            <pre>
              <code>{recommended}</code>
            </pre>
          </figure>
        </div>
        <figure className={styles.keyboard}>
          <PhoneKeyboard kind={keyboard} />
          <figcaption>
            A phone typically shows <strong>{KEYBOARD_TEXT[keyboard]}</strong>. Exact layouts vary
            by device.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
