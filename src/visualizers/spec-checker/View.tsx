import { Check, Circle } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { CodeEditor } from '../../components/code-editor/CodeEditor.tsx';
import { mountSandbox } from '../../engine/runners/web-sandbox/index.ts';
import type { VisualizerViewProps } from '../contract.ts';
import type { SpecCheckerProps } from './build.ts';
import { runChecks } from './model.ts';
import styles from './View.module.css';

const PREVIEW_DELAY_MS = 300;

/**
 * The learner's markup is untrusted: the preview runs in the sandboxed iframe, and the checks
 * run on a DOMParser document, which never executes scripts or event handlers.
 */
function Preview({ html, css }: { html: string; css: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let handle: ReturnType<typeof mountSandbox> | undefined;
    const timer = setTimeout(() => {
      handle = mountSandbox(
        element,
        { files: { 'index.html': html, 'style.css': css } },
        { title: 'The page' },
      );
    }, PREVIEW_DELAY_MS);
    return () => {
      clearTimeout(timer);
      handle?.dispose();
    };
  }, [html, css]);
  return <div ref={host} className={styles.preview} />;
}

export default function SpecCheckerView({ props }: VisualizerViewProps<SpecCheckerProps>) {
  const id = useId();
  const [html, setHtml] = useState(props.starter);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const outcomes = runChecks(doc.body, props.checks);
  const done = outcomes.filter((o) => o.pass).length;

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <div className={styles.editor}>
          <CodeEditor value={html} onChange={setHtml} language="html" label="Page markup editor" />
        </div>
        <Preview
          html={html}
          css={`body { margin: 0; padding: 16px; font: 15px/1.5 system-ui, sans-serif; }\n${props.css}`}
        />
      </div>

      <section className={styles.spec} aria-labelledby={`${id}-spec`}>
        <h3 id={`${id}-spec`} className={styles.title}>
          The spec: {done} of {props.checks.length} done
        </h3>
        <progress
          className={styles.progress}
          max={props.checks.length}
          value={done}
          aria-hidden="true"
        />
        <ul className={styles.checks} aria-live="polite">
          {outcomes.map((o) => (
            <li key={o.label} data-pass={o.pass || undefined}>
              {o.pass ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
              <span>
                {o.label}
                <span className="visually-hidden">{o.pass ? ': done' : ': not yet'}</span>
                {!o.pass && o.detail && <span className={styles.detail}> ({o.detail})</span>}
              </span>
            </li>
          ))}
        </ul>
        {done === props.checks.length && (
          <p className={styles.complete}>Every item of the spec is met.</p>
        )}
      </section>
    </div>
  );
}
