import { GraduationCap, History } from 'lucide-react';
import { Link } from 'react-router';
import { CodeBlock } from '../../components/CodeBlock.tsx';
import { InlineCode } from '../../components/InlineCode.tsx';
import type { CompiledEntry, Usage } from '../../engine/content/cheatsheet-types.ts';
import styles from './CheatSheets.module.css';

const USAGE_TEXT: Record<Usage, string> = { daily: 'Daily', common: 'Common', rare: 'Rare' };
const USAGE_DOTS: Record<Usage, string> = { daily: '●●●', common: '●●○', rare: '●○○' };

/** Usage as text plus a shape (never color alone); prints as the word. */
export function UsageBadge({ usage }: { usage: Usage }) {
  return (
    <span className={styles.usage} data-usage={usage}>
      <span aria-hidden="true" className={styles.dots}>
        {USAGE_DOTS[usage]}
      </span>
      {USAGE_TEXT[usage]}
    </span>
  );
}

export function SheetEntry({ entry }: { entry: CompiledEntry }) {
  const headingId = `${entry.id}-title`;
  return (
    <article id={entry.id} className={styles.entry} aria-labelledby={headingId} data-print="keep">
      <header className={styles.entryHeader}>
        <h3 id={headingId} className={styles.entryTitle}>
          <a href={`#${entry.id}`} className={styles.anchor}>
            <InlineCode text={entry.title} />
          </a>
        </h3>
        <div className={styles.entryMeta}>
          {entry.legacy && (
            <span className={styles.legacy}>
              <History aria-hidden="true" /> Legacy, still common
            </span>
          )}
          <UsageBadge usage={entry.usage} />
        </div>
      </header>
      {entry.kind === 'code' ? (
        <CodeBlock block={entry.code} />
      ) : (
        <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={entry.title}>
          <table className={styles.table}>
            <thead>
              <tr>
                {entry.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) =>
                    j === 0 ? (
                      <th key={j} scope="row" dangerouslySetInnerHTML={{ __html: cell }} />
                    ) : (
                      <td key={j} dangerouslySetInnerHTML={{ __html: cell }} />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.explain} dangerouslySetInnerHTML={{ __html: entry.explainHtml }} />
      {entry.kind === 'table' && entry.notesHtml.length > 0 && (
        <ul className={styles.notes}>
          {entry.notesHtml.map((n, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: n }} />
          ))}
        </ul>
      )}
      {entry.learn && (
        <Link to={`/learn/${entry.learn.id}`} className={styles.learn} data-print="hide">
          <GraduationCap aria-hidden="true" /> Learn it: <InlineCode text={entry.learn.title} />
        </Link>
      )}
    </article>
  );
}
