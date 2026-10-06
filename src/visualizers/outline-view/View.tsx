import { CircleAlert, CornerDownRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/Button.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { headingOutline } from '../shared/a11y/a11y.ts';
import { ExampleEditor } from '../shared/ExampleEditor.tsx';
import { useExampleSources } from '../shared/use-example-sources.ts';
import type { OutlineViewProps } from './build.ts';
import { fakeHeadings } from './model.ts';
import styles from './View.module.css';

export default function OutlineView({ props }: VisualizerViewProps<OutlineViewProps>) {
  const editor = useExampleSources(props.examples);
  const body = new DOMParser().parseFromString(editor.settled, 'text/html').body;
  const outline = headingOutline(body);
  const fakes = fakeHeadings(body);
  // The "virtual cursor" of a screen reader user pressing H; reset whenever the page changes.
  const [cursor, setCursor] = useState({ source: editor.settled, index: -1 });
  const index = cursor.source === editor.settled ? cursor.index : -1;
  const current = outline.headings[index];

  const next = () => {
    if (outline.headings.length === 0) return;
    setCursor({ source: editor.settled, index: (index + 1) % outline.headings.length });
  };

  return (
    <div className={styles.frame}>
      <div className={styles.lab}>
        <div className={styles.editor}>
          <ExampleEditor examples={props.examples} state={editor} label="HTML source" />
        </div>

        <section className={styles.rotor} aria-label="Headings list">
          <div className={styles.rotorBar}>
            <h3 className={styles.title}>Headings list</h3>
            <Button size="sm" onClick={next} disabled={outline.headings.length === 0}>
              Next heading (H)
            </Button>
          </div>
          <p className={styles.spoken} aria-live="polite">
            {current
              ? `“${current.name || 'blank'}, heading level ${current.level}”`
              : 'Screen reader users press H to jump from heading to heading.'}
          </p>

          {outline.issues.map((issue) => (
            <p key={issue.kind} className={styles.issue}>
              <CircleAlert aria-hidden="true" /> {issue.message}
            </p>
          ))}

          {outline.headings.length === 0 ? (
            <p className={styles.empty}>No headings at all: nothing to jump to.</p>
          ) : (
            <ol className={styles.list}>
              {outline.headings.map((heading, i) => (
                <li
                  key={i}
                  className={styles.item}
                  style={{ ['--depth' as string]: heading.level - 1 }}
                  data-current={i === index || undefined}
                  data-problem={heading.issues.length > 0 || undefined}
                >
                  <span className={styles.level}>H{heading.level}</span>
                  <span className={styles.name}>{heading.name || '(empty)'}</span>
                  {heading.issues.map((issue) => (
                    <span key={issue.kind} className={styles.itemIssue}>
                      <CircleAlert aria-hidden="true" /> {issue.message}
                    </span>
                  ))}
                </li>
              ))}
            </ol>
          )}

          {fakes.length > 0 && (
            <div className={styles.fakes}>
              <p className={styles.fakesTitle}>Look like headings, but aren’t in the list:</p>
              <ul>
                {fakes.map((fake, i) => (
                  <li key={i}>
                    <CornerDownRight aria-hidden="true" /> <code>{fake.tag}</code> {fake.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
