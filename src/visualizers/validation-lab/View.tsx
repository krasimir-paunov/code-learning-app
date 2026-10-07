import { useEffect, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { ValidationLabProps } from './build.ts';
import { FLAG_TEXT, flagFor, inputMarkup, type Constraint, type Flag } from './model.ts';
import styles from './View.module.css';

type Styling = ':invalid' | ':user-invalid';

const BASE_CSS = `
  :host { color: CanvasText; color-scheme: light; }
  form { display: grid; gap: 8px; padding: 16px; background: Canvas; font: 15px/1.4 system-ui, sans-serif; }
  input { padding: 8px; border: 2px solid #6b7280; border-radius: 4px; font: inherit; }
  button { justify-self: start; padding: 8px 14px; border: 0; border-radius: 4px; background: #1d4ed8; color: #fff; font: inherit; }
  :focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
  /* The message's space is kept, so the Send button doesn't jump away mid-click when it appears. */
  .error { visibility: hidden; margin: 0; color: #b91c1c; font-size: 14px; }
`;

const errorCss = (selector: Styling) => `
  input${selector} { border-color: #b91c1c; background: #fef2f2; }
  input${selector} + .error { visibility: visible; }
`;

interface Reading {
  flags: Partial<Record<Flag, boolean>>;
  valid: boolean;
  message: string;
}

const ALL_FLAGS = Object.keys(FLAG_TEXT) as Flag[];

function read(input: HTMLInputElement): Reading {
  return {
    flags: Object.fromEntries(ALL_FLAGS.map((f) => [f, input.validity[f]])),
    valid: input.validity.valid,
    message: input.validationMessage,
  };
}

/** Applies constraints to the live input, so its value and "edited by the user" state survive. */
function applyConstraints(
  input: HTMLInputElement,
  all: readonly Constraint[],
  on: ReadonlySet<number>,
) {
  all.forEach((c, i) => {
    if (on.has(i)) input.setAttribute(c.attr, c.value ?? '');
    else input.removeAttribute(c.attr);
  });
}

export default function ValidationLabView({ props }: VisualizerViewProps<ValidationLabProps>) {
  const [fieldIndex, setFieldIndex] = useState('0');
  const field = props.fields[Number(fieldIndex)] ?? props.fields[0];
  const [enabled, setEnabled] = useState<Set<number>>(
    () => new Set(field?.constraints.map((_, i) => i)),
  );
  const [styling, setStyling] = useState<Styling>(':user-invalid');
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [outcome, setOutcome] = useState('');

  const html = field
    ? `<form>
  <label for="field">${field.label}</label>
  ${inputMarkup('field', field.name, field.type, [])}
  <p class="error" aria-hidden="true">Check this field.</p>
  <button>Send</button>
</form>`
    : '';

  useEffect(() => {
    const input = root?.querySelector('input');
    if (!root || !input || !field) return;
    applyConstraints(input, field.constraints, enabled);
    const update = () => setReading(read(input));
    update();
    const invalid = () => setOutcome(`Blocked. The browser says: “${input.validationMessage}”`);
    const submit = (event: Event) => {
      event.preventDefault();
      setOutcome('Valid, so the form would be sent.');
    };
    root.addEventListener('input', update);
    root.addEventListener('focusout', update);
    // `invalid` doesn't bubble, so listen while it travels down.
    root.addEventListener('invalid', invalid, true);
    root.addEventListener('submit', submit);
    return () => {
      root.removeEventListener('input', update);
      root.removeEventListener('focusout', update);
      root.removeEventListener('invalid', invalid, true);
      root.removeEventListener('submit', submit);
    };
  }, [root, field, enabled]);

  if (!field) return null;
  const active = field.constraints
    .map((c, i) => ({ c, i }))
    .filter(({ i }) => enabled.has(i))
    .map(({ c }) => c);
  const shown = inputMarkup('field', field.name, field.type, active);
  const flags = [
    ...new Set(
      [
        ...active.map(flagFor),
        flagFor({ attr: 'type', value: field.type }),
        field.type === 'number' ? 'badInput' : null,
      ].filter((f): f is Flag => f !== null),
    ),
  ];

  return (
    <div className={styles.frame}>
      {props.fields.length > 1 && (
        <SegmentedControl
          label="Field"
          size="sm"
          options={props.fields.map((f, i) => ({ value: String(i), label: f.label }))}
          value={fieldIndex}
          onChange={(value) => {
            setFieldIndex(value);
            const next = props.fields[Number(value)];
            setEnabled(new Set(next?.constraints.map((_, i) => i)));
            setOutcome('');
          }}
        />
      )}

      <fieldset className={styles.rule}>
        <legend>Constraints</legend>
        {field.constraints.map((c, i) => (
          <label key={`${field.name}-${c.attr}`} className={styles.constraint}>
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
            <code>{c.value === undefined ? c.attr : `${c.attr}="${c.value}"`}</code>
          </label>
        ))}
      </fieldset>

      <div className={styles.layout}>
        <div className={styles.column}>
          <ShadowStage
            html={html}
            css={`
              ${BASE_CSS}${errorCss(styling)}
            `}
            className={styles.stage}
            label="The field"
            onRender={(r) => setRoot((current) => (current === r ? current : r))}
          />
          <SegmentedControl<Styling>
            label="Red error style uses"
            size="sm"
            options={[
              { value: ':user-invalid', label: ':user-invalid' },
              { value: ':invalid', label: ':invalid' },
            ]}
            value={styling}
            onChange={setStyling}
          />
          {outcome && (
            <p className={styles.outcome} aria-live="polite">
              {outcome}
            </p>
          )}
        </div>

        <section className={styles.panel} aria-label="Validity state">
          <h3 className={styles.title}>
            <code>input.validity</code>
          </h3>
          <ul className={styles.flags} aria-live="polite">
            {flags.map((flag) => {
              const on = reading?.flags[flag] ?? false;
              return (
                <li key={flag} data-on={on || undefined}>
                  <code>{flag}</code>
                  <span>
                    {on ? 'true' : 'false'}
                    {on && `: ${FLAG_TEXT[flag]}`}
                  </span>
                </li>
              );
            })}
            <li data-valid={reading?.valid || undefined}>
              <code>valid</code>
              <span>{reading?.valid ? 'true' : 'false'}</span>
            </li>
          </ul>
          {reading?.message && (
            <p className={styles.message}>
              <code>validationMessage</code>: “{reading.message}”
            </p>
          )}
        </section>
      </div>

      <pre className={styles.code}>
        <code>{shown}</code>
      </pre>
    </div>
  );
}
