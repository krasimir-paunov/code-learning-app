import { lazy, Suspense, useId, useRef } from 'react';
import { TerminalLoader } from '../../effects/TerminalLoader.tsx';
import { useProgress } from '../../engine/progress/store.ts';
import { useNearViewport } from '../use-near-viewport.ts';
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
 * Code editor with the learner's font size. CodeMirror is its own lazy chunk, loaded only when an
 * editor nears the viewport, so pages without one (or with one below the fold) don't wait for it.
 */
export function CodeEditor(props: CodeEditorProps) {
  const fontSize = useProgress((s) => s.progress.settings.editorFontSize);
  const hintId = useId();
  const root = useRef<HTMLDivElement>(null);
  const near = useNearViewport(root);
  const loader = <TerminalLoader line="loading editor" />;
  return (
    <div
      ref={root}
      className={styles.editor}
      style={{ ['--editor-font-size' as string]: `${fontSize}px` }}
    >
      {near ? (
        <Suspense fallback={loader}>
          <CodeMirrorEditor
            {...props}
            describedBy={[props.describedBy, hintId].filter(Boolean).join(' ')}
          />
        </Suspense>
      ) : (
        loader
      )}
      <p id={hintId} className={styles.hint}>
        Tab indents. Press Esc, then Tab, to leave the editor.
      </p>
    </div>
  );
}
