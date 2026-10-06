import { useState } from 'react';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import { OptionList } from '../../shared/OptionList.tsx';
import styles from '../../shared/challenge.module.css';
import type { ChoiceAnswer, ChoiceSpec } from './index.ts';

export default function ChoiceView({
  spec,
  state,
  submit,
  disabled,
}: ChallengeViewProps<ChoiceSpec, ChoiceAnswer>) {
  const [selected, setSelected] = useState<number[]>([]);
  // Judged options: the last submitted selection, or every correct option once passed.
  const judged = new Set<number>(
    state.passed ? spec.correct : ((state.lastResult?.highlight as number[] | undefined) ?? []),
  );

  return (
    <div className={styles.stack}>
      <OptionList
        legend="Answer"
        multiple={spec.multiple}
        selected={selected}
        onChange={setSelected}
        disabled={disabled}
        options={spec.options.map((option, i) => {
          if (!judged.has(i)) return { html: option.html };
          const right = spec.correct.includes(i);
          return {
            html: option.html,
            verdict: right ? 'right' : 'wrong',
            note: <span dangerouslySetInnerHTML={{ __html: option.whyHtml }} />,
          };
        })}
      />
      <div>
        <CheckButton onCheck={() => submit(selected)} disabled={disabled} />
      </div>
    </div>
  );
}
