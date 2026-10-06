import { useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import type { UrlResolverProps } from './build.ts';
import { FileTree } from './FileTree.tsx';
import { buildTree, walk } from './model.ts';
import styles from './View.module.css';

export default function UrlResolverView({ props }: VisualizerViewProps<UrlResolverProps>) {
  const tree = buildTree(props.files);
  const [page, setPage] = useState(props.page);
  const [href, setHref] = useState(props.hrefs[0] ?? '');
  const result = walk(href, props.origin + page);
  const end = result.steps.at(-1)?.path;
  const exists = end ? props.files.includes(end) || end.endsWith('/') : false;
  const marks = new Map(result.steps.map((s, i) => [s.path, i + 1] as const));

  return (
    <div className={styles.frame}>
      <div className={styles.lab}>
        <div className={styles.treeBox}>
          <p className={styles.hint}>Click a page to stand on it.</p>
          <FileTree
            tree={tree}
            current={page}
            marks={marks}
            target={end}
            onSelect={(node) => setPage(node.path)}
            selectable={(node) => !node.folder && node.name.endsWith('.html')}
          />
        </div>

        <div className={styles.side}>
          <p className={styles.pageLine}>
            On <code>{props.origin + page}</code>
          </p>
          <label className={styles.field}>
            <span className={styles.mono}>href</span>
            <input
              value={href}
              onChange={(event) => setHref(event.target.value)}
              spellCheck={false}
            />
          </label>
          <div className={styles.picks} role="group" aria-label="Try these hrefs">
            {props.hrefs.map((h) => (
              <button
                key={h}
                type="button"
                className={styles.pick}
                aria-pressed={h === href}
                onClick={() => setHref(h)}
              >
                {h}
              </button>
            ))}
          </div>

          <div className={styles.result} aria-live="polite">
            {result.kind === 'invalid' && <p>Not a valid URL.</p>}
            {result.kind === 'other-site' && result.resolved && (
              <p>
                Another site: <code>{result.resolved.href}</code>. The page’s location doesn’t
                matter.
              </p>
            )}
            {result.kind === 'fragment' && result.resolved && (
              <p>
                The same page: <code>{result.resolved.href}</code>
              </p>
            )}
            {(result.kind === 'relative' || result.kind === 'root') && (
              <>
                <p>
                  {result.kind === 'root'
                    ? 'Starts with /, so the walk starts at the site root:'
                    : `Relative, so the walk starts in the page’s folder, ${result.start}:`}
                </p>
                <ol className={styles.steps}>
                  {result.steps.map((step, i) => (
                    <li key={i}>
                      <code>{step.segment}</code> {step.note}
                    </li>
                  ))}
                </ol>
                <p className={styles.resolved} data-missing={!exists || undefined}>
                  <code>{result.resolved?.href}</code>
                  {exists ? '' : ': no such file (404)'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
