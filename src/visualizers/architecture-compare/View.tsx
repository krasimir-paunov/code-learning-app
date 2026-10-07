import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import type { ArchitectureCompareProps } from './build.ts';
import { changedLines, diffLines, type DiffLine } from './model.ts';
import styles from './View.module.css';

type Approach = ArchitectureCompareProps['approaches'][number];
type Task = ArchitectureCompareProps['tasks'][number];

interface FileView {
  name: string;
  lines: DiffLine[];
  status: 'kept' | 'new' | 'deleted';
}

/** Block scalars end with a newline; it isn't a line of code. */
const lines = (code: string) => code.replace(/\n$/, '').split('\n');

/** Backtick spans in summaries and notes become code, without parsing any HTML. */
function Inline({ text }: { text: string }) {
  return text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

/** Every file of an approach, diffed against its starting point when a task is chosen. */
function filesFor(approach: Approach, task: Task | undefined): FileView[] {
  const after = task?.changes[approach.name]?.files ?? [];
  const names = [...new Set([...approach.files.map((f) => f.name), ...after.map((f) => f.name)])];
  return names.map((name) => {
    const before = approach.files.find((f) => f.name === name);
    const changed = after.find((f) => f.name === name);
    if (!changed) {
      const same = lines(before?.code ?? '').map((text): DiffLine => ({ kind: 'same', text }));
      return { name, lines: same, status: 'kept' };
    }
    if (!before) {
      const added = lines(changed.code).map((text): DiffLine => ({ kind: 'add', text }));
      return { name, lines: added, status: 'new' };
    }
    // An empty file after the change means the file was deleted.
    if (changed.code === '') {
      const removed = lines(before.code).map((text): DiffLine => ({ kind: 'del', text }));
      return { name, lines: removed, status: 'deleted' };
    }
    const diff = diffLines(lines(before.code).join('\n'), lines(changed.code).join('\n'));
    return { name, lines: diff, status: 'kept' };
  });
}

const MARK = { same: ' ', add: '+', del: '−' } as const;

export default function ArchitectureCompareView({
  props,
}: VisualizerViewProps<ArchitectureCompareProps>) {
  const [approachIndex, setApproachIndex] = useState('0');
  const [taskIndex, setTaskIndex] = useState<number | null>(null);
  const approach = props.approaches[Number(approachIndex)] ?? props.approaches[0];
  const task = taskIndex === null ? undefined : props.tasks[taskIndex];
  if (!approach) return null;

  const files = filesFor(approach, task);
  const stats = props.approaches.map((a) => {
    const views = filesFor(a, task);
    const touched = views.filter((v) => changedLines(v.lines) > 0);
    return {
      name: a.name,
      files: touched.length,
      lines: views.reduce((s, v) => s + changedLines(v.lines), 0),
    };
  });

  return (
    <div className={styles.frame}>
      <SegmentedControl
        label="Approach"
        size="sm"
        options={props.approaches.map((a, i) => ({ value: String(i), label: a.name }))}
        value={approachIndex}
        onChange={setApproachIndex}
      />
      <p className={styles.summary}>
        <Inline text={approach.summary} />
      </p>

      <div className={styles.tasks} role="group" aria-label="Change request">
        <button
          type="button"
          className={styles.task}
          aria-pressed={taskIndex === null}
          onClick={() => setTaskIndex(null)}
        >
          Starting point
        </button>
        {props.tasks.map((t, i) => (
          <button
            key={t.label}
            type="button"
            className={styles.task}
            aria-pressed={taskIndex === i}
            onClick={() => setTaskIndex(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.files}>
        {files.map((file) => (
          <figure key={file.name} className={styles.file}>
            <figcaption>
              <code>{file.name}</code>
              {file.status !== 'kept' && (
                <span className={styles.newFile} data-status={file.status}>
                  {file.status === 'new' ? 'new file' : 'deleted'}
                </span>
              )}
            </figcaption>
            <pre className={styles.code}>
              {file.lines.map((line, i) => (
                <span key={i} className={styles.line} data-kind={line.kind}>
                  <span className={styles.mark} aria-hidden="true">
                    {MARK[line.kind]}
                  </span>
                  {line.kind !== 'same' && (
                    <span className="visually-hidden">
                      {line.kind === 'add' ? 'added: ' : 'removed: '}
                    </span>
                  )}
                  {line.text || ' '}
                  {'\n'}
                </span>
              ))}
            </pre>
          </figure>
        ))}
      </div>

      {task && (
        <>
          <p className={styles.note} aria-live="polite">
            <Inline text={task.changes[approach.name]?.note ?? ''} />
          </p>
          <table className={styles.table}>
            <caption>“{task.label}”, in each approach</caption>
            <thead>
              <tr>
                <th scope="col">Approach</th>
                <th scope="col">Files touched</th>
                <th scope="col">Lines changed</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.name} data-current={s.name === approach.name || undefined}>
                  <th scope="row">{s.name}</th>
                  <td>{s.files}</td>
                  <td>{s.lines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
