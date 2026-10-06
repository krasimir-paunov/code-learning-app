import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Tabs } from '../../components/Tabs.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { SemanticsLensProps } from './build.ts';
import {
  ADDS,
  INLINE_TAGS,
  numbered,
  phrases,
  toHtml,
  type InlineTag,
  type Phrase,
} from './model.ts';
import styles from './View.module.css';

function Means({ tag }: { tag: InlineTag }) {
  const { role } = ADDS[tag];
  if (tag === 'span')
    return <span className={styles.muted}>no role and no look: a styling hook</span>;
  return role ? (
    <>
      role <code>{role}</code>
    </>
  ) : (
    <span className={styles.muted}>no role: it only changes the look</span>
  );
}

function Data({ tag, phrase }: { tag: InlineTag; phrase: Phrase }) {
  if (tag === 'time' && phrase.datetime)
    return (
      <>
        <code>datetime="{phrase.datetime}"</code>: software reads the exact date
      </>
    );
  if (tag === 'abbr' && phrase.title)
    return (
      <>
        <code>title="{phrase.title}"</code>: the full form
      </>
    );
  return <span className={styles.muted}>nothing machine-readable</span>;
}

export default function SemanticsLensView({ props }: VisualizerViewProps<SemanticsLensProps>) {
  const list = phrases(props.paragraphs);
  const [choices, setChoices] = useState<InlineTag[]>(() => list.map(() => 'span'));
  const [touched, setTouched] = useState<boolean[]>(() => list.map(() => false));
  const [lens, setLens] = useState('looks');
  const html = toHtml(props.paragraphs, choices);
  const right = list.filter((p, i) => choices[i] === p.want).length;

  const choose = (index: number, tag: InlineTag) => {
    setChoices((all) => all.map((c, i) => (i === index ? tag : c)));
    setTouched((all) => all.map((t, i) => t || i === index));
  };

  return (
    <div className={styles.lens}>
      <div className={styles.text}>
        {numbered(props.paragraphs).map((parts, p) => (
          <p key={p} className={styles.paragraph}>
            {parts.map((part, j) => {
              if (typeof part === 'string') return <span key={j}>{part}</span>;
              const { phrase, index } = part;
              const chosen = choices[index] ?? 'span';
              const done = touched[index];
              const ok = chosen === phrase.want;
              return (
                <span
                  key={j}
                  className={styles.phrase}
                  data-state={done ? (ok ? 'ok' : 'no') : undefined}
                >
                  <span className={styles.phraseText}>{phrase.text}</span>
                  <select
                    className={styles.select}
                    value={chosen}
                    aria-label={`Element for “${phrase.text}”`}
                    onChange={(event) => choose(index, event.target.value as InlineTag)}
                  >
                    {INLINE_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        &lt;{tag}&gt;
                      </option>
                    ))}
                  </select>
                </span>
              );
            })}
          </p>
        ))}
      </div>

      <p className={styles.score} aria-live="polite">
        {right} of {list.length} phrases say what they mean.
      </p>

      <Tabs
        label="Lens"
        value={lens}
        onChange={setLens}
        tabs={[
          {
            id: 'looks',
            label: 'Looks',
            content: (
              <div className={styles.panel}>
                <ShadowStage html={html} className={styles.stage} inert />
                <p className={styles.muted}>
                  Default browser styles: <code>strong</code> and <code>b</code> look the same, and
                  so do <code>em</code> and <code>i</code>.
                </p>
              </div>
            ),
          },
          {
            id: 'means',
            label: 'Means',
            content: (
              <ul className={styles.rows}>
                {list.map((phrase, i) => {
                  const tag = choices[i] ?? 'span';
                  return (
                    <li key={i}>
                      <span className={styles.rowLabel}>
                        <code>&lt;{tag}&gt;</code> {phrase.text}
                      </span>
                      <span>
                        <Means tag={tag} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            ),
          },
          {
            id: 'data',
            label: 'Data',
            content: (
              <ul className={styles.rows}>
                {list.map((phrase, i) => {
                  const tag = choices[i] ?? 'span';
                  return (
                    <li key={i}>
                      <span className={styles.rowLabel}>
                        <code>&lt;{tag}&gt;</code> {phrase.text}
                      </span>
                      <span>
                        <Data tag={tag} phrase={phrase} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            ),
          },
          {
            id: 'markup',
            label: 'Markup',
            content: (
              <pre className={styles.markup}>
                <code>{html}</code>
              </pre>
            ),
          },
        ]}
      />

      <ul className={styles.feedback} aria-label="Your choices">
        {list.map((phrase, i) =>
          touched[i] ? (
            <li key={i} data-ok={choices[i] === phrase.want || undefined}>
              {choices[i] === phrase.want ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
              <span>
                <strong>“{phrase.text}”</strong>{' '}
                {choices[i] === phrase.want
                  ? phrase.why
                  : `<${choices[i]}> doesn't say that. Think about what this phrase is.`}
              </span>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}
