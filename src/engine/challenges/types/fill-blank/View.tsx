import { useState } from 'react';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import styles from '../../shared/challenge.module.css';
import type { FillBlankAnswer, FillBlankSpec } from './index.ts';
import local from './View.module.css';

export default function FillBlankView({
  spec,
  state,
  submit,
  disabled,
}: ChallengeViewProps<FillBlankSpec, FillBlankAnswer>) {
  const [values, setValues] = useState<FillBlankAnswer>({});
  const wrong = new Set((state.lastResult?.highlight as string[] | undefined) ?? []);
  const byName = new Map(spec.blanks.map((b) => [b.name, b]));

  return (
    <div className={styles.stack}>
      <pre className={local.code}>
        <code>
          {spec.lines.map((line, i) => (
            <span key={i} className={local.line}>
              {line.map((segment, j) => {
                if ('html' in segment) {
                  // Build-time highlighted HTML from repository content.
                  return <span key={j} dangerouslySetInnerHTML={{ __html: segment.html }} />;
                }
                const blank = byName.get(segment.blank);
                if (!blank) return null;
                return (
                  <input
                    key={j}
                    className={local.blank}
                    aria-label={blank.label}
                    aria-invalid={wrong.has(blank.name) || undefined}
                    style={{ inlineSize: `${blank.size}ch` }}
                    value={values[blank.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [blank.name]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void submit(values);
                    }}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    disabled={disabled}
                  />
                );
              })}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
      <div>
        <CheckButton onCheck={() => submit(values)} disabled={disabled} />
      </div>
    </div>
  );
}
