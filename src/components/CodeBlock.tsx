import { useState } from 'react';
import { LANG_LABELS, type CodeLang, type CompiledCodeBlock } from '../engine/content/code.ts';
import styles from './CodeBlock.module.css';
import { CopyButton } from './CopyButton.tsx';
import { Tabs } from './Tabs.tsx';
import { cx } from './cx.ts';

interface CodeBlockProps {
  block: CompiledCodeBlock;
  /** Learner's preferred language tab (e.g. "cs" once they start the C# track). */
  preferredLang?: CodeLang;
  className?: string;
}

function CodePane({ html, output }: { html: string; output?: string }) {
  return (
    <>
      {/* Horizontal scroll inside the block: wrapping would change what code means. */}
      <div
        className={styles.code}
        // Highlighted HTML is generated at build time from repository content (trusted).
        dangerouslySetInnerHTML={{ __html: html }}
        // The scroll container must be keyboard-scrollable when it overflows.
        tabIndex={0}
        role="region"
        aria-label="Code"
      />
      {output !== undefined && (
        <div className={styles.output}>
          <div className={styles.outputLabel}>Output</div>
          <pre>{output}</pre>
        </div>
      )}
    </>
  );
}

/** Pre-highlighted code with language tabs, copy button and optional verified output. */
export function CodeBlock({ block, preferredLang, className }: CodeBlockProps) {
  const initial = block.tabs.find((tab) => tab.lang === preferredLang) ?? block.tabs[0];
  const [selected, setSelected] = useState<string>(initial?.lang ?? '');
  const current = block.tabs.find((tab) => tab.lang === selected) ?? block.tabs[0];
  if (!current) return null;

  const copy = <CopyButton text={current.source} what={`${LANG_LABELS[current.lang]} code`} />;

  return (
    <figure className={cx(styles.block, className)} data-print="keep">
      {block.caption && <figcaption className={styles.caption}>{block.caption}</figcaption>}
      {block.tabs.length > 1 ? (
        <Tabs
          label="Language"
          value={current.lang}
          onChange={setSelected}
          actions={copy}
          tabs={block.tabs.map((tab) => ({
            id: tab.lang,
            label: LANG_LABELS[tab.lang],
            content: <CodePane html={tab.html} output={tab.output} />,
          }))}
        />
      ) : (
        <>
          <div className={styles.bar}>
            <span className={styles.lang}>{LANG_LABELS[current.lang]}</span>
            {copy}
          </div>
          <CodePane html={current.html} output={current.output} />
        </>
      )}
    </figure>
  );
}
