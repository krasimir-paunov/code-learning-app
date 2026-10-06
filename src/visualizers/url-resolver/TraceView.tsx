import type { TraceViewProps } from '../contract.ts';
import type { UrlTraceProps } from './build.ts';
import { FileTree } from './FileTree.tsx';
import { buildTree } from './model.ts';
import styles from './View.module.css';

/** Learner-drives mode: click the folders the browser walks through, then the file. */
export default function UrlTraceView({
  props,
  steps,
  wrongStep,
  done,
  disabled,
  propose,
}: TraceViewProps<UrlTraceProps, string>) {
  const marks = new Map(steps.map((path, i) => [path, i + 1] as const));
  return (
    <div className={styles.trace}>
      <p>
        On <code>{props.origin + props.page}</code>, a link has <code>href="{props.href}"</code>.{' '}
        {done ? 'Done.' : `Click step ${steps.length + 1}.`}
      </p>
      <FileTree
        tree={buildTree(props.files)}
        current={props.page}
        marks={marks}
        wrong={typeof wrongStep === 'string' ? wrongStep : undefined}
        target={done ? steps.at(-1) : undefined}
        onSelect={(node) => propose(node.path)}
        selectable={() => true}
        disabled={disabled || done}
      />
    </div>
  );
}
