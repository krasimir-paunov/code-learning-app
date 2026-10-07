import { useEffect, useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { ActivationLogProps } from './build.ts';
import { addEntry, BEHAVIOR, type Kind, type LogEntry } from './model.ts';
import styles from './View.module.css';

const STAGE_CSS = `
  :host { color: CanvasText; color-scheme: light; }
  .page { display: grid; gap: 14px; padding: 16px; background: Canvas; font: 15px/1.4 system-ui, sans-serif; }
  form { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; border: 1px dashed #9ca3af; border-radius: 6px; }
  form::before { content: "<form>"; flex-basis: 100%; color: #6b7280; font: 12px ui-monospace, monospace; }
  button, .fake { padding: 8px 14px; border: 0; border-radius: 4px; background: #1d4ed8; color: #fff; font: inherit; cursor: pointer; }
  .fake { justify-self: start; }
  a { justify-self: start; color: #1d4ed8; }
  :focus-visible { outline: 3px solid #f59e0b; outline-offset: 2px; }
`;

const CODE: Record<Kind, string> = {
  link: '<a href>',
  submit: '<button> in a form',
  button: '<button type="button">',
  div: '<div> with a click handler',
};

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export default function ActivationLogView({ props }: VisualizerViewProps<ActivationLogProps>) {
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const html = `<div class="page">
  <form action="${props.href}">
    <button data-kind="submit">${escape(props.labels.submit)}</button>
    <button type="button" data-kind="button">${escape(props.labels.button)}</button>
  </form>
  <a href="${props.href}" data-kind="link">${escape(props.labels.link)}</a>
  <div class="fake" data-kind="div">${escape(props.labels.div)}</div>
</div>`;

  useEffect(() => {
    if (!root) return;
    const write = (text: string) => setLog((l) => addEntry(l, text));
    const kindOf = (event: Event) =>
      (event.target as Element).closest<HTMLElement>('[data-kind]')?.dataset.kind as
        Kind | undefined;

    const key = (event: Event) => {
      const { key: pressed } = event as KeyboardEvent;
      const kind = kindOf(event);
      if (kind && (pressed === 'Enter' || pressed === ' ')) {
        write(`${pressed === ' ' ? 'Space' : 'Enter'} pressed on ${CODE[kind]}`);
      }
    };
    const click = (event: Event) => {
      const kind = kindOf(event);
      if (!kind) return;
      write(`click on ${CODE[kind]}`);
      if (kind === 'link') {
        // Shown, never followed: the lesson page must stay put.
        event.preventDefault();
        write(`→ the browser follows the link to ${props.href} (stopped here)`);
      }
    };
    const submit = (event: Event) => {
      event.preventDefault();
      write('→ the form is submitted and the page reloads (stopped here)');
    };
    root.addEventListener('keydown', key);
    root.addEventListener('click', click);
    root.addEventListener('submit', submit);
    return () => {
      root.removeEventListener('keydown', key);
      root.removeEventListener('click', click);
      root.removeEventListener('submit', submit);
    };
  }, [root, props.href]);

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <div className={styles.column}>
          <ShadowStage
            html={html}
            css={STAGE_CSS}
            className={styles.stage}
            label="Four clickable elements"
            onRender={(r) => setRoot((current) => (current === r ? current : r))}
          />
          <p className={styles.hint}>
            Click each one. Then Tab through them and press Enter and Space.
          </p>
        </div>
        <section className={styles.log} aria-label="Event log">
          <div className={styles.logHead}>
            <h3 className={styles.title}>What happened</h3>
            <button
              type="button"
              className={styles.clear}
              onClick={() => setLog([])}
              disabled={!log.length}
            >
              Clear
            </button>
          </div>
          <ol className={styles.entries} aria-live="polite">
            {log.length === 0 && <li className={styles.empty}>Nothing yet.</li>}
            {log.map((entry) => (
              <li key={entry.id} data-result={entry.text.startsWith('→') || undefined}>
                {entry.text}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <table className={styles.table}>
        <caption>What each element does</caption>
        <thead>
          <tr>
            <th scope="col">Element</th>
            <th scope="col">Tab reaches it</th>
            <th scope="col">Enter</th>
            <th scope="col">Space</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(BEHAVIOR) as Kind[]).map((kind) => (
            <tr key={kind}>
              <th scope="row">
                <code>{CODE[kind]}</code>
              </th>
              <td>{BEHAVIOR[kind].tab ? 'yes' : 'no'}</td>
              <td>{BEHAVIOR[kind].enter}</td>
              <td>{BEHAVIOR[kind].space}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
