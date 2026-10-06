import { lazy, Suspense, useId } from 'react';
import { TerminalLoader } from '../../effects/TerminalLoader.tsx';
import { useProgress } from '../../engine/progress/store.ts';
import styles from './CodeEditor.module.css';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'js' | 'css' | 'html';
  /** Accessible name of the editing surface, e.g. "main.js editor". */
  label: string;
  readOnly?: boolean;
  describedBy?: string;
}

const CodeMirrorEditor = lazy(() => import('./CodeMirrorEditor.tsx'));

/**
 * Code editor with the learner's font size. CodeMirror is its own lazy chunk, so pages
 * without an editor never download it.
 */
export function CodeEditor(props: CodeEditorProps) {
  const fontSize = useProgress((s) => s.progress.settings.editorFontSize);
  const hintId = useId();
  return (
    <div className={styles.editor} style={{ ['--editor-font-size' as string]: `${fontSize}px` }}>
      <Suspense fallback={<TerminalLoader line="loading editor" />}>
        <CodeMirrorEditor
          {...props}
          describedBy={[props.describedBy, hintId].filter(Boolean).join(' ')}
        />
      </Suspense>
      <p id={hintId} className={styles.hint}>
        Tab indents. Press Esc, then Tab, to leave the editor.
      </p>
    </div>
  );
}
