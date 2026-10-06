import { useEffect, useRef, useState } from 'react';
import { Badge } from '../../components/Badge.tsx';
import { Tabs } from '../../components/Tabs.tsx';
import { Toggle } from '../../components/Toggle.tsx';
import { mountSandbox } from '../../engine/runners/web-sandbox/index.ts';
import type { VisualizerViewProps } from '../contract.ts';
import { ExampleEditor } from '../shared/ExampleEditor.tsx';
import { useExampleSources } from '../shared/use-example-sources.ts';
import type { DomTreeProps } from './build.ts';
import {
  addedElements,
  buildTree,
  countElements,
  hexBytes,
  tokenize,
  type Token,
  type TreeNode,
} from './model.ts';
import styles from './View.module.css';

const BYTE_LIMIT = 96;

function NodeView({ node, showWhitespace }: { node: TreeNode; showWhitespace: boolean }) {
  const children = node.children.filter((c) => showWhitespace || !c.whitespace);
  let label;
  if (node.kind === 'element') {
    label = (
      <span className={styles.element}>
        &lt;{node.label}
        {node.attributes.map(([name, value]) => (
          <span key={name} className={styles.attr}>
            {' '}
            {name}=<span className={styles.value}>"{value}"</span>
          </span>
        ))}
        &gt;
        {node.added && (
          <span className={styles.added}>
            <Badge tone="warning">added by the parser</Badge>
          </span>
        )}
      </span>
    );
  } else if (node.kind === 'text') {
    label = (
      <span className={styles.text}>
        {node.whitespace ? (
          <span className={styles.whitespace}>whitespace text</span>
        ) : (
          `"${node.label}"`
        )}
      </span>
    );
  } else if (node.kind === 'comment') {
    label = <span className={styles.comment}>&lt;!--{node.label}--&gt;</span>;
  } else {
    label = <span className={styles.comment}>&lt;!doctype html&gt;</span>;
  }
  return (
    <li>
      {label}
      {children.length > 0 && (
        <ul className={styles.children}>
          {children.map((child, i) => (
            <NodeView key={i} node={child} showWhitespace={showWhitespace} />
          ))}
        </ul>
      )}
    </li>
  );
}

function TokenList({ tokens }: { tokens: readonly Token[] }) {
  return (
    <ol className={styles.tokens}>
      {tokens.map((token, i) => (
        <li key={i} data-type={token.type}>
          <span className={styles.tokenType}>
            {
              {
                start: 'Start tag',
                end: 'End tag',
                text: 'Text',
                comment: 'Comment',
                doctype: 'Doctype',
              }[token.type]
            }
          </span>
          <code>{token.type === 'text' ? JSON.stringify(token.text) : token.text}</code>
        </li>
      ))}
    </ol>
  );
}

function RenderStage({ source }: { source: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const handle = mountSandbox(
      element,
      { files: { 'index.html': source } },
      { title: 'Rendered page', className: styles.frame },
    );
    return () => handle.dispose();
  }, [source]);
  return <div ref={host} className={styles.render} />;
}

export default function DomTreeView({ props }: VisualizerViewProps<DomTreeProps>) {
  const editor = useExampleSources(props.examples);
  const settled = editor.settled;
  const [stage, setStage] = useState('dom');
  const [showWhitespace, setShowWhitespace] = useState(false);

  const tokens = tokenize(settled);
  const tree = buildTree(new DOMParser().parseFromString(settled, 'text/html'), tokens);
  const added = addedElements(tree);
  const bytes = hexBytes(settled, BYTE_LIMIT);
  const path = new URL(props.url).pathname;

  return (
    <div className={styles.frameWrap}>
      <div className={styles.lab}>
        <div className={styles.editor}>
          <ExampleEditor examples={props.examples} state={editor} label="HTML source" />
        </div>

        <div className={styles.pipeline}>
          <p className={styles.request}>
            <span className={styles.step}>Request</span>
            <code>GET {path}</code> → <code>200 OK</code>, <code>text/html</code>
          </p>
          <Tabs
            label="Pipeline stage"
            value={stage}
            onChange={setStage}
            tabs={[
              {
                id: 'bytes',
                label: 'Bytes',
                content: (
                  <div className={styles.panel}>
                    <p className={styles.summary}>
                      {bytes.total} bytes arrive. To the browser they are only numbers until it
                      decodes them as UTF-8.
                    </p>
                    <p className={styles.hex}>
                      {bytes.hex.join(' ')}
                      {bytes.total > BYTE_LIMIT && ` … ${bytes.total - BYTE_LIMIT} more`}
                    </p>
                  </div>
                ),
              },
              {
                id: 'tokens',
                label: 'Tokens',
                content: (
                  <div className={styles.panel}>
                    <p className={styles.summary}>
                      The tokenizer cuts the text into {tokens.length} tokens: tags and text, in the
                      order you wrote them. No nesting yet.
                    </p>
                    <TokenList tokens={tokens} />
                  </div>
                ),
              },
              {
                id: 'dom',
                label: 'DOM tree',
                content: (
                  <div className={styles.panel}>
                    <p className={styles.summary} aria-live="polite">
                      {countElements(tree)} elements.{' '}
                      {added.length > 0
                        ? `The parser added ${added.length} that your source never opened: ${added.map((n) => `<${n}>`).join(', ')}.`
                        : 'Every element comes from your source.'}
                    </p>
                    <Toggle
                      label="Show whitespace text nodes"
                      checked={showWhitespace}
                      onChange={setShowWhitespace}
                    />
                    <ul className={styles.tree} aria-label="DOM tree">
                      {tree.children.map((child, i) => (
                        <NodeView key={i} node={child} showWhitespace={showWhitespace} />
                      ))}
                    </ul>
                  </div>
                ),
              },
              {
                id: 'render',
                label: 'Render',
                content: (
                  <div className={styles.panel}>
                    <p className={styles.summary}>
                      Layout and paint turn the tree, not your text, into pixels.
                    </p>
                    {stage === 'render' && <RenderStage source={settled} />}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
