import { File, FileCode, Folder, MapPin } from 'lucide-react';
import type { TreeNode } from './model.ts';
import styles from './View.module.css';

export interface FileTreeProps {
  tree: TreeNode;
  /** The page you are on. */
  current: string;
  /** Step numbers shown beside visited folders/files. */
  marks: ReadonlyMap<string, number>;
  /** The path the link resolves to (highlighted). */
  target?: string;
  /** A wrong pick to flag (trace mode). */
  wrong?: string;
  onSelect?: (node: TreeNode) => void;
  /** Which nodes can be clicked (default: none). */
  selectable?: (node: TreeNode) => boolean;
  disabled?: boolean;
}

function Row({ node, depth, ...props }: FileTreeProps & { node: TreeNode; depth: number }) {
  const isCurrent = node.path === props.current;
  const mark = props.marks.get(node.path);
  const clickable = props.onSelect && props.selectable?.(node) && !props.disabled;
  const icon = node.folder ? (
    <Folder aria-hidden="true" />
  ) : node.name.endsWith('.html') ? (
    <FileCode aria-hidden="true" />
  ) : (
    <File aria-hidden="true" />
  );
  const label = (
    <>
      {icon}
      <span className={styles.name}>{node.name}</span>
      {isCurrent && (
        <span className={styles.here}>
          <MapPin aria-hidden="true" /> you are here
        </span>
      )}
      {mark !== undefined && <span className={styles.mark}>{mark}</span>}
    </>
  );
  return (
    <li>
      {clickable ? (
        <button
          type="button"
          className={styles.row}
          style={{ ['--depth' as string]: depth }}
          data-target={node.path === props.target || undefined}
          data-wrong={node.path === props.wrong || undefined}
          data-visited={mark !== undefined || undefined}
          onClick={() => props.onSelect?.(node)}
        >
          {label}
        </button>
      ) : (
        <span
          className={styles.row}
          style={{ ['--depth' as string]: depth }}
          data-target={node.path === props.target || undefined}
          data-visited={mark !== undefined || undefined}
        >
          {label}
        </span>
      )}
      {node.children.length > 0 && (
        <ul className={styles.tree}>
          {node.children.map((child) => (
            <Row key={child.path} {...props} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** A site's folders and files with "you are here", visited steps and the link's target. */
export function FileTree(props: FileTreeProps) {
  return (
    <ul className={styles.tree} aria-label="Site files">
      <Row {...props} node={props.tree} depth={0} />
    </ul>
  );
}
