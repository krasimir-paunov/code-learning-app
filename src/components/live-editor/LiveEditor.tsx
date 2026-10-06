import { Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '../Button.tsx';
import { ConsolePanel } from '../ConsolePanel.tsx';
import { Dialog } from '../Dialog.tsx';
import { Kbd } from '../Kbd.tsx';
import { Tabs } from '../Tabs.tsx';
import { cx } from '../cx.ts';
import { useNearViewport } from '../use-near-viewport.ts';
import { CodeEditor } from '../code-editor/CodeEditor.tsx';
import type { ConsoleEntry, Diagnostic, RunResult } from '../../engine/runners/contract.ts';
import { mountSandbox, type SandboxHandle } from '../../engine/runners/web-sandbox/index.ts';
import styles from './LiveEditor.module.css';

export interface LiveEditorProps {
  /** Starting files, e.g. { 'index.html': …, 'style.css': … }; Reset returns to these. */
  initialFiles: Record<string, string>;
  /** Files the learner may edit (default: all). */
  editable?: readonly string[];
  /** Show the rendered page (default: when there is an HTML or CSS file). */
  preview?: boolean;
  /** Re-run shortly after typing stops (default: on when there is a preview). */
  autoRun?: boolean;
  onChange?: (files: Record<string, string>) => void;
  onRun?: (result: RunResult) => void;
  /** Extra buttons in the toolbar (e.g. a challenge's Check button). */
  actions?: ReactNode;
  /** Shown under the editor (e.g. test results). */
  footer?: ReactNode;
}

const AUTO_RUN_DELAY_MS = 600;

function languageOf(file: string): 'js' | 'css' | 'html' {
  if (file.endsWith('.css')) return 'css';
  if (file.endsWith('.html')) return 'html';
  return 'js';
}

/**
 * Sandboxed live HTML/CSS/JS editor: file tabs, CodeMirror editors, a preview rendered in an
 * isolated iframe (fresh on every run), and a console with errors mapped to file and line.
 */
export function LiveEditor({
  initialFiles,
  editable,
  preview,
  autoRun,
  onChange,
  onRun,
  actions,
  footer,
}: LiveEditorProps) {
  const names = Object.keys(initialFiles);
  const showPreview = preview ?? names.some((n) => n.endsWith('.html') || n.endsWith('.css'));
  const runAutomatically = autoRun ?? showPreview;
  const [files, setFiles] = useState(initialFiles);
  const [active, setActive] = useState(names[0] ?? '');
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [status, setStatus] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<SandboxHandle | null>(null);
  const onRunRef = useRef(onRun);
  const onChangeRef = useRef(onChange);
  const statusId = useId();

  useEffect(() => {
    onRunRef.current = onRun;
    onChangeRef.current = onChange;
  }, [onRun, onChange]);

  useEffect(() => {
    onChangeRef.current?.(files);
  }, [files]);

  const run = useCallback(async (source: Record<string, string>) => {
    if (!host.current) return;
    handle.current?.dispose();
    setEntries([]);
    setDiagnostics([]);
    const current = mountSandbox(
      host.current,
      { files: source },
      {
        title: 'Preview of your page',
        className: styles.frame,
        onConsole: (entry) => setEntries((previous) => [...previous, entry]),
      },
    );
    handle.current = current;
    const result = await current.result;
    if (handle.current !== current) return; // a newer run replaced this one
    setDiagnostics(result.diagnostics);
    setStatus(
      {
        ok: `Ran in ${Math.max(1, Math.round(result.durationMs))} ms.`,
        'compile-error': 'Not run: fix the syntax error first.',
        'runtime-error': 'Ran with an error (see the console).',
        timeout: 'Stopped: the code did not finish in time.',
      }[result.status],
    );
    onRunRef.current?.(result);
  }, []);

  useEffect(() => () => handle.current?.dispose(), []);

  // Ctrl/Cmd+Enter runs from anywhere inside the editor (the Run button is the visible way).
  const root = useRef<HTMLDivElement>(null);
  const latestFiles = useRef(files);
  useEffect(() => {
    latestFiles.current = files;
  }, [files]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void run(latestFiles.current);
      }
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [run]);

  // The first automatic run waits until the editor is near the viewport: the preview is not
  // visible before then, and building the sandbox document would compete with the first paint.
  const near = useNearViewport(root);
  useEffect(() => {
    if (!runAutomatically || !near) return;
    const timer = setTimeout(() => void run(files), AUTO_RUN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [files, run, runAutomatically, near]);

  function update(name: string, value: string) {
    setFiles((previous) => ({ ...previous, [name]: value }));
  }

  function reset() {
    setFiles(initialFiles);
    setConfirmReset(false);
    setStatus('Code reset to the starting version.');
    void run(initialFiles);
  }

  return (
    <div ref={root} className={cx(styles.editor, showPreview && styles.withPreview)}>
      <div className={styles.code}>
        <Tabs
          label="Files"
          value={active}
          onChange={setActive}
          tabs={names.map((name) => ({
            id: name,
            label: name,
            content: (
              <CodeEditor
                value={files[name] ?? ''}
                onChange={(value) => update(name, value)}
                language={languageOf(name)}
                label={`${name} editor`}
                readOnly={editable ? !editable.includes(name) : false}
              />
            ),
          }))}
        />
        <div className={styles.toolbar}>
          <Button
            size="sm"
            variant="secondary"
            icon={<Play />}
            onClick={() => void run(files)}
            aria-describedby={statusId}
          >
            Run
          </Button>
          <span className={styles.shortcut} aria-hidden="true">
            <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
          </span>
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw />}
            onClick={() => setConfirmReset(true)}
          >
            Reset
          </Button>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        <p id={statusId} className={styles.status} role="status">
          {status}
        </p>
        {footer}
      </div>
      <div className={styles.output}>
        <div
          ref={host}
          className={showPreview ? styles.preview : styles.hiddenHost}
          aria-hidden={showPreview ? undefined : true}
        />
        <ConsolePanel entries={entries} diagnostics={diagnostics} />
      </div>
      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the code?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Keep my code
            </Button>
            <Button variant="danger" onClick={reset}>
              Reset
            </Button>
          </>
        }
      >
        <p>Your changes in every file will be replaced with the starting version.</p>
      </Dialog>
    </div>
  );
}
