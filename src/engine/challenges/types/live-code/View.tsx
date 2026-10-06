import { useState } from 'react';
import { TestResults } from '../../../../components/TestResults.tsx';
import { LiveEditor } from '../../../../components/live-editor/LiveEditor.tsx';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import type { LiveCodeAnswer, LiveCodeSpec } from './index.ts';

export default function LiveCodeView({
  spec,
  state,
  submit,
  disabled,
}: ChallengeViewProps<LiveCodeSpec, LiveCodeAnswer>) {
  const [files, setFiles] = useState(spec.files);
  const results = (state.lastResult?.details ?? []).map((d) => ({
    name: d.label,
    passed: d.passed,
    message: d.message,
  }));

  return (
    <LiveEditor
      initialFiles={spec.files}
      editable={disabled ? [] : spec.editable}
      preview={spec.preview}
      onChange={setFiles}
      actions={<CheckButton label="Run tests" onCheck={() => submit(files)} disabled={disabled} />}
      footer={<TestResults tests={results} />}
    />
  );
}
