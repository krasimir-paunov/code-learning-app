import { useEffect, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { FormInspectorProps } from './build.ts';
import { request, sentReason, type Field, type Method, type Request } from './model.ts';
import styles from './View.module.css';

const FORM_CSS = `
  :host { color: CanvasText; color-scheme: light; }
  form { display: grid; gap: 12px; padding: 16px; background: Canvas; font: 15px/1.4 system-ui, sans-serif; }
  .field { display: grid; gap: 4px; }
  .check { display: flex; align-items: center; gap: 8px; }
  input:not([type="checkbox"]) { padding: 6px 8px; border: 1px solid #6b7280; border-radius: 4px; font: inherit; }
  button { justify-self: start; padding: 8px 14px; border: 0; border-radius: 4px; background: #1d4ed8; color: #fff; font: inherit; }
  input:focus-visible, button:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
`;

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

interface Submission {
  request: Request;
  fields: (Field & { sent: boolean; reason: string; labelled: boolean })[];
}

export default function FormInspectorView({ props }: VisualizerViewProps<FormInspectorProps>) {
  const [method, setMethod] = useState<Method>(props.method);
  const [named, setNamed] = useState(true);
  const [connected, setConnected] = useState(true);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const markup = [
    `<form action="${props.action}" method="${method}">`,
    ...props.fields.map((f, i) => {
      const id = `f${i}`;
      const name = f.nameToggle && !named ? '' : ` name="${f.name}"`;
      const forId = connected ? ` for="${id}"` : '';
      const idAttr = connected ? ` id="${id}"` : '';
      const value =
        f.type === 'checkbox' ? ` value="yes"` : f.value ? ` value="${escape(f.value)}"` : '';
      const input = `<input type="${f.type}"${idAttr}${name}${value} data-label="${escape(f.label)}">`;
      return f.type === 'checkbox'
        ? `  <div class="check">${input}<label${forId}>${escape(f.label)}</label></div>`
        : `  <div class="field"><label${forId}>${escape(f.label)}</label>${input}</div>`;
    }),
    `  <button>${escape(props.submit.label)}</button>`,
    '</form>',
  ].join('\n');

  // A new form means earlier results no longer describe it.
  const [shownMarkup, setShownMarkup] = useState(markup);
  if (shownMarkup !== markup) {
    setShownMarkup(markup);
    setSubmission(null);
  }

  useEffect(() => {
    if (!root) return;
    const submit = (event: Event) => {
      // The request is only shown, never sent: the page must not navigate.
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const data = new FormData(form, (event as SubmitEvent).submitter);
      const pairs = [...data].map(([k, v]): [string, string] => [k, String(v)]);
      const fields = [...form.querySelectorAll('input')].map((input) => {
        const field: Field = {
          label: input.dataset.label ?? '',
          name: input.getAttribute('name'),
          type: input.type,
          checked: input.checked,
          disabled: input.disabled,
        };
        return { ...field, ...sentReason(field), labelled: (input.labels?.length ?? 0) > 0 };
      });
      setSubmission({
        request: request(form.method === 'post' ? 'post' : 'get', props.action, pairs),
        fields,
      });
    };
    root.addEventListener('submit', submit);
    return () => root.removeEventListener('submit', submit);
  }, [root, props.action]);

  const toggled = props.fields.find((f) => f.nameToggle);

  return (
    <div className={styles.frame}>
      <div className={styles.controls}>
        <SegmentedControl<Method>
          label="method"
          size="sm"
          options={[
            { value: 'get', label: 'GET' },
            { value: 'post', label: 'POST' },
          ]}
          value={method}
          onChange={setMethod}
        />
        {toggled && (
          <Toggle
            label={`${toggled.label} field has name="${toggled.name}"`}
            checked={named}
            onChange={setNamed}
          />
        )}
        <Toggle label="Labels connected (for and id)" checked={connected} onChange={setConnected} />
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
            Fill it in and press <strong>{props.submit.label}</strong>. Nothing leaves this page.
          </p>
        </div>

        <section className={styles.result} aria-live="polite" aria-label="The request">
          {submission ? (
            <>
              <pre className={styles.request}>
                <code>
                  {submission.request.line}
                  {submission.request.contentType &&
                    `\nContent-Type: ${submission.request.contentType}`}
                  {submission.request.body !== null &&
                    `\n\n${submission.request.body || '(empty body)'}`}
                </code>
              </pre>
              <table className={styles.fields}>
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Sent?</th>
                    <th scope="col">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {submission.fields.map((f) => (
                    <tr key={f.label} data-sent={f.sent || undefined}>
                      <th scope="row">{f.label}</th>
                      <td>{f.sent ? f.reason : `no: ${f.reason}`}</td>
                      <td>{f.labelled ? 'connected' : 'not connected'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className={styles.waiting}>Submit the form to see what the browser sends.</p>
          )}
        </section>
      </div>

      <figure className={styles.code}>
        <figcaption>The markup</figcaption>
        <pre>
          <code>{markup.replaceAll(/ data-label="[^"]*"/g, '')}</code>
        </pre>
      </figure>
    </div>
  );
}
