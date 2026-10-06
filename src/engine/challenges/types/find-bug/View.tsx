import { useId, useState } from 'react';
import { cx } from '../../../../components/cx.ts';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import { OptionList } from '../../shared/OptionList.tsx';
import styles from '../../shared/challenge.module.css';
import type { FindBugAnswer, FindBugSpec } from './index.ts';
import local from './View.module.css';

export default function FindBugView({
  spec,
  state,
  submit,
  disabled,
}: ChallengeViewProps<FindBugSpec, FindBugAnswer>) {
  const [lines, setLines] = useState<number[]>([]);
  const [lineConfirmed, setLineConfirmed] = useState(false);
  const [choice, setChoice] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const fixId = useId();
  const multiple = spec.bugLines.length > 1;
  const wrongLines = new Set(
    (state.lastResult?.highlight as { wrongLines?: number[] } | undefined)?.wrongLines ?? [],
  );
  const showFix = lineConfirmed || state.passed;

  function toggle(line: number) {
    setLineConfirmed(false);
    setLines((current) =>
      multiple
        ? current.includes(line)
          ? current.filter((l) => l !== line)
          : [...current, line]
        : current.includes(line)
          ? []
          : [line],
    );
  }

  return (
    <div className={styles.stack}>
      <p className={styles.label} id={`${fixId}-lines`}>
        {multiple ? 'Select the buggy lines:' : 'Select the buggy line:'}
      </p>
      <ol className={local.code} aria-labelledby={`${fixId}-lines`}>
        {spec.lines.map((html, i) => {
          const line = i + 1;
          const selected = lines.includes(line);
          return (
            <li key={line}>
              <button
                type="button"
                className={cx(
                  local.line,
                  selected && local.selected,
                  wrongLines.has(line) && local.wrong,
                )}
                aria-pressed={selected}
                aria-label={`Line ${line}`}
                onClick={() => toggle(line)}
                disabled={disabled}
              >
                <span className={local.number} aria-hidden="true">
                  {line}
                </span>
                {/* Build-time highlighted HTML from repository content. */}
                <code dangerouslySetInnerHTML={{ __html: html || ' ' }} />
              </button>
            </li>
          );
        })}
      </ol>
      {!showFix && (
        <div>
          <CheckButton
            label="Check line"
            disabled={disabled}
            onCheck={async () => {
              const result = await submit({ stage: 'line', lines });
              if (result.partial && lines.length > 0) setLineConfirmed(true);
            }}
          />
        </div>
      )}
      {showFix && (
        <>
          {spec.fix.kind === 'choices' ? (
            <OptionList
              legend="Choose the fix"
              code
              options={spec.fix.choices.map((c) => ({ html: c.html }))}
              selected={choice}
              onChange={setChoice}
              disabled={disabled}
            />
          ) : (
            <>
              <label htmlFor={fixId} className={styles.label}>
                Type the corrected line
              </label>
              <input
                id={fixId}
                className={styles.answer}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                disabled={disabled}
              />
            </>
          )}
          <div>
            <CheckButton
              label="Check fix"
              disabled={disabled}
              onCheck={() =>
                submit({
                  stage: 'fix',
                  lines,
                  fix: spec.fix.kind === 'choices' ? (choice[0] ?? -1) : typed,
                })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
