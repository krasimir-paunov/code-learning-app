import { useId, useState } from 'react';
import { CodeBlock } from '../../../../components/CodeBlock.tsx';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import { OptionList } from '../../shared/OptionList.tsx';
import styles from '../../shared/challenge.module.css';
import type { PredictOutputAnswer, PredictOutputSpec } from './index.ts';

function escape(text: string) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
}

export default function PredictOutputView({
  spec,
  submit,
  disabled,
}: ChallengeViewProps<PredictOutputSpec, PredictOutputAnswer>) {
  const [answer, setAnswer] = useState('');
  const [choice, setChoice] = useState<number[]>([]);
  const inputId = useId();

  return (
    <div className={styles.stack}>
      <CodeBlock block={spec.code} />
      {spec.choices ? (
        <OptionList
          legend="What does it print?"
          code
          options={spec.choices.map((c) => ({ html: `<pre>${escape(c)}</pre>` }))}
          selected={choice}
          onChange={setChoice}
          disabled={disabled}
        />
      ) : (
        <>
          <label htmlFor={inputId} className={styles.label}>
            Your prediction (one line per printed line)
          </label>
          <textarea
            id={inputId}
            className={styles.answer}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            disabled={disabled}
          />
        </>
      )}
      <div>
        <CheckButton
          disabled={disabled}
          onCheck={() => submit(spec.choices ? (spec.choices[choice[0] ?? -1] ?? '') : answer)}
        />
      </div>
    </div>
  );
}
