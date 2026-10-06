import { useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { SelectorLabProps } from './build.ts';
import { describeSelector } from './model.ts';
import styles from './View.module.css';

type Match = { ok: true; elements: Set<Element> } | { ok: false; reason: string };

function match(body: Element, selector: string): Match {
  if (!selector.trim()) return { ok: false, reason: 'Type a selector.' };
  if (selector.includes('::'))
    return {
      ok: false,
      reason: 'Pseudo-elements style a part of an element; they can’t be selected as elements.',
    };
  try {
    return { ok: true, elements: new Set(body.querySelectorAll(selector)) };
  } catch {
    return { ok: false, reason: 'The browser can’t parse this selector.' };
  }
}

function Tree({ element, matches }: { element: Element; matches: Set<Element> }) {
  return (
    <ul className={styles.tree}>
      {Array.from(element.children).map((child, i) => {
        const classes = Array.from(child.classList, (c) => `.${c}`).join('');
        const attrs = Array.from(child.attributes)
          .filter((a) => a.name !== 'class')
          .map((a) => `[${a.name}="${a.value}"]`)
          .join('');
        return (
          <li key={i}>
            <span className={styles.node} data-match={matches.has(child) || undefined}>
              <span className={styles.tag}>{child.localName}</span>
              <span className={styles.classes}>{classes}</span>
              <span className={styles.attrs}>{attrs}</span>
            </span>
            {child.children.length > 0 && <Tree element={child} matches={matches} />}
          </li>
        );
      })}
    </ul>
  );
}

export default function SelectorLabView({ props }: VisualizerViewProps<SelectorLabProps>) {
  const [selector, setSelector] = useState(props.picks[0] ?? '');
  const body = new DOMParser().parseFromString(props.html, 'text/html').body;
  const result = match(body, selector);
  const sentence = describeSelector(selector);
  const highlight = result.ok
    ? `${selector} { outline: 2px dashed var(--accent); outline-offset: 2px; background-color: color-mix(in oklch, var(--accent) 14%, transparent); }`
    : '';

  return (
    <div className={styles.frame}>
      <label className={styles.field}>
        <span>Selector</span>
        <input
          value={selector}
          onChange={(event) => setSelector(event.target.value)}
          spellCheck={false}
        />
      </label>
      <div className={styles.picks} role="group" aria-label="Try these selectors">
        {props.picks.map((pick) => (
          <button
            key={pick}
            type="button"
            className={styles.pick}
            aria-pressed={pick === selector}
            onClick={() => setSelector(pick)}
          >
            {pick}
          </button>
        ))}
      </div>
      <div className={styles.readout} aria-live="polite">
        {sentence && <p className={styles.sentence}>{sentence}</p>}
        <p className={styles.count} data-error={!result.ok || undefined}>
          {result.ok
            ? `${result.elements.size} ${result.elements.size === 1 ? 'match' : 'matches'}`
            : result.reason}
        </p>
      </div>
      <div className={styles.lab}>
        <section className={styles.panel} aria-label="Page">
          <h3 className={styles.panelTitle}>Page</h3>
          <ShadowStage
            html={props.html}
            css={`
              ${props.css}\n${highlight}
            `}
            className={styles.stage}
            inert
          />
        </section>
        <section className={styles.panel} aria-label="DOM tree">
          <h3 className={styles.panelTitle}>DOM tree</h3>
          <div className={styles.treeBox}>
            <Tree element={body} matches={result.ok ? result.elements : new Set()} />
          </div>
        </section>
      </div>
    </div>
  );
}
