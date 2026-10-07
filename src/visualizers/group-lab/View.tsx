import { useEffect, useState } from 'react';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { accessibleName, role } from '../shared/a11y/a11y.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { GroupLabProps } from './build.ts';
import { position, tabStops, type Radio } from './model.ts';
import styles from './View.module.css';

const FORM_CSS = `
  :host { color: CanvasText; color-scheme: light; }
  form { display: grid; gap: 14px; padding: 16px; background: Canvas; font: 15px/1.4 system-ui, sans-serif; }
  fieldset { display: grid; gap: 6px; margin: 0; padding: 10px 12px; border: 1px solid #6b7280; border-radius: 6px; }
  legend, .question { padding: 0 4px; font-weight: 700; }
  .question { margin: 0; }
  .radios { display: grid; gap: 6px; }
  .field { display: grid; gap: 4px; }
  select, textarea { padding: 6px 8px; border: 1px solid #6b7280; border-radius: 4px; font: inherit; }
  :focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
`;

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const slug = (text: string) => text.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');

interface Focused {
  role: string;
  name: string;
  state: string | null;
  position: string | null;
  group: string;
}

/** What the accessibility tree says about a control, read from the live element. */
function describe(element: Element, radios: readonly Radio[], all: readonly Element[]): Focused {
  const fieldset = element.closest('fieldset');
  const isRadio = element instanceof HTMLInputElement && element.type === 'radio';
  const at = position(radios, all.indexOf(element));
  return {
    role: role(element),
    name: accessibleName(element),
    state: isRadio ? (element.checked ? 'checked' : 'not checked') : null,
    position: isRadio ? `${at.pos} of ${at.size}` : null,
    group: fieldset ? accessibleName(fieldset) : '',
  };
}

export default function GroupLabView({ props }: VisualizerViewProps<GroupLabProps>) {
  const [fieldset, setFieldset] = useState(false);
  const [named, setNamed] = useState(false);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [focused, setFocused] = useState<Focused | null>(null);
  const [checked, setChecked] = useState<string[]>([]);

  const radios: Radio[] = props.options.map((label) => ({
    name: named ? props.name : null,
    label,
  }));
  const radioMarkup = props.options
    .map(
      (label) =>
        `    <label><input type="radio"${named ? ` name="${props.name}"` : ''} value="${slug(label)}"> ${escape(label)}</label>`,
    )
    .join('\n');
  const group = fieldset
    ? `  <fieldset>\n    <legend>${escape(props.question)}</legend>\n${radioMarkup}\n  </fieldset>`
    : `  <div class="radios">\n    <p class="question">${escape(props.question)}</p>\n${radioMarkup}\n  </div>`;
  const markup = [
    '<form>',
    group,
    `  <div class="field"><label for="size">${escape(props.select.label)}</label>`,
    `    <select id="size" name="size">${props.select.options.map((o) => `<option>${escape(o)}</option>`).join('')}</select></div>`,
    `  <div class="field"><label for="notes">${escape(props.textarea.label)}</label>`,
    '    <textarea id="notes" name="notes" rows="3"></textarea></div>',
    '</form>',
  ].join('\n');

  // A different form starts from a clean slate.
  const [shown, setShown] = useState(markup);
  if (shown !== markup) {
    setShown(markup);
    setFocused(null);
    setChecked([]);
  }

  useEffect(() => {
    if (!root) return;
    const controls = () => [...root.querySelectorAll('input[type="radio"]')];
    const update = (event: Event) => {
      const target = event.target as Element;
      if (!target.matches('input, select, textarea')) return;
      const inputs = controls();
      setFocused(describe(target, radios, inputs));
      setChecked(
        inputs
          .filter(
            (input): input is HTMLInputElement =>
              input instanceof HTMLInputElement && input.checked,
          )
          .map((input) => accessibleName(input)),
      );
    };
    root.addEventListener('focusin', update);
    root.addEventListener('change', update);
    return () => {
      root.removeEventListener('focusin', update);
      root.removeEventListener('change', update);
    };
  }, [root, radios]);

  return (
    <div className={styles.frame}>
      <div className={styles.toggles}>
        <Toggle
          label="Wrap the radios in <fieldset> with a <legend>"
          checked={fieldset}
          onChange={setFieldset}
        />
        <Toggle
          label={`Give every radio name="${props.name}"`}
          checked={named}
          onChange={setNamed}
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.column}>
          <ShadowStage
            html={markup}
            css={FORM_CSS}
            className={styles.stage}
            label="The form"
            onRender={(r) => setRoot((current) => (current === r ? current : r))}
          />
          <p className={styles.hint}>
            Click the radios, then Tab into the group and use the arrow keys.
          </p>
        </div>

        <section
          className={styles.panel}
          aria-live="polite"
          aria-label="What assistive technology gets"
        >
          <h3 className={styles.title}>Focused control</h3>
          {focused ? (
            <dl className={styles.facts}>
              <div>
                <dt>Role</dt>
                <dd>{focused.role}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{focused.name || 'none'}</dd>
              </div>
              {focused.state && (
                <div>
                  <dt>State</dt>
                  <dd>{focused.state}</dd>
                </div>
              )}
              {focused.position && (
                <div>
                  <dt>Position</dt>
                  <dd>{focused.position}</dd>
                </div>
              )}
              <div>
                <dt>Group</dt>
                <dd>{focused.group || 'none: the question is just text nearby'}</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.waiting}>Focus a control in the form.</p>
          )}
          <h3 className={styles.title}>The radios</h3>
          <dl className={styles.facts}>
            <div>
              <dt>Checked now</dt>
              <dd>{checked.length ? checked.join(', ') : 'none'}</dd>
            </div>
            <div>
              <dt>Tab stops</dt>
              <dd>{tabStops(radios)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <figure className={styles.code}>
        <figcaption>The markup</figcaption>
        <pre>
          <code>{markup}</code>
        </pre>
      </figure>
    </div>
  );
}
