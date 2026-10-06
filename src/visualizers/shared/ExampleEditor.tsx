import { CodeEditor } from '../../components/code-editor/CodeEditor.tsx';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { EditableExample, useExampleSources } from './use-example-sources.ts';

interface ExampleEditorProps {
  examples: readonly EditableExample[];
  state: ReturnType<typeof useExampleSources>;
  /** Accessible name of the editor, e.g. "HTML source". */
  label: string;
  language?: 'html' | 'css' | 'js';
  pickerLabel?: string;
}

export function ExampleEditor({
  examples,
  state,
  label,
  language = 'html',
  pickerLabel = 'Start from',
}: ExampleEditorProps) {
  return (
    <>
      {examples.length > 1 && (
        <SegmentedControl
          label={pickerLabel}
          size="sm"
          options={examples.map((e, i) => ({ value: String(i), label: e.label }))}
          value={state.example}
          onChange={state.setExample}
        />
      )}
      <CodeEditor
        key={state.example}
        value={state.source}
        onChange={state.setSource}
        language={language}
        label={label}
      />
    </>
  );
}
