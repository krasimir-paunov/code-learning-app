import { useRef, useState, type KeyboardEvent } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { AnatomyExample, AnatomyExplorerProps } from './build.ts';
import { partsAt, segments, VOID_ELEMENTS, type Part, type PartKind } from './model.ts';
import styles from './View.module.css';

const KIND_LABEL: Record<PartKind, string> = {
  element: 'Element',
  'start-tag': 'Start tag',
  'end-tag': 'End tag',
  'tag-name': 'Tag name',
  attribute: 'Attribute',
  'attribute-name': 'Attribute name',
  'attribute-value': 'Attribute value',
  content: 'Content',
};

const TAG_MEANING: Record<string, string> = {
  a: 'a link',
  img: 'an image',
  p: 'a paragraph',
  button: 'a button',
  strong: 'important text',
  em: 'stressed text',
  input: 'a form field',
  h1: 'the main heading',
};

function describe(part: Part, example: AnatomyExample): string {
  const text = example.source.slice(part.start, part.end);
  switch (part.kind) {
    case 'element':
      return VOID_ELEMENTS.has(part.tag)
        ? `A void element: <${part.tag}> can't contain anything, so it is only a start tag. No end tag.`
        : `The whole element: start tag, content and end tag. The browser turns it into one node of the page.`;
    case 'start-tag':
      return `The start tag opens the <${part.tag}> element and carries all of its attributes.`;
    case 'end-tag':
      return `The end tag closes the element: the same name with a slash. Attributes never go here.`;
    case 'tag-name': {
      const meaning = TAG_MEANING[part.tag];
      return `The tag name says which element this is${meaning ? `: <${part.tag}> is ${meaning}` : ''}.`;
    }
    case 'attribute':
      return text.includes('=')
        ? `An attribute configures the element. It always sits inside the start tag, as name="value".`
        : `A boolean attribute: no value needed. Being present means true; remove it to turn it off.`;
    case 'attribute-name':
      return `The attribute name. ${example.notes[text] ?? ''}`.trim();
    case 'attribute-value':
      return `The attribute value, in quotes. Quote every value: spaces and some characters break unquoted ones.`;
    case 'content':
      return `The content: what the element contains. It can be text, other elements, or both.`;
  }
}

/** The part a click on this segment selects: the most specific one. */
function innermost(parts: readonly Part[], offset: number): Part | undefined {
  return partsAt(parts, offset).at(-1);
}

function ExampleView({ example }: { example: AnatomyExample }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const segmentRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cuts = segments(example.source, example.parts);
  const active = selected === null ? undefined : example.parts[selected];
  const chain = active
    ? partsAt(example.parts, active.start).filter((p) => p.end >= active.end)
    : [];

  const select = (index: number) => {
    const segment = cuts[index];
    if (!segment) return;
    setFocusIndex(index);
    setSelected(innermost(example.parts, segment.start)?.id ?? null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    let next: number | undefined;
    if (step) next = Math.min(cuts.length - 1, Math.max(0, focusIndex + step));
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = cuts.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    segmentRefs.current[next]?.focus();
  };

  return (
    <div className={styles.example}>
      <div
        className={styles.code}
        role="listbox"
        aria-label="Source code, one option per part"
        aria-orientation="horizontal"
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {cuts.map((segment, index) => {
          const part = innermost(example.parts, segment.start);
          const inSelection = active && segment.start >= active.start && segment.end <= active.end;
          const isFocusable = index === focusIndex;
          const text = example.source.slice(segment.start, segment.end);
          return (
            <span
              key={segment.start}
              ref={(el) => {
                segmentRefs.current[index] = el;
              }}
              role="option"
              aria-selected={inSelection ? true : false}
              aria-label={`${text.trim() || 'space'}: ${part ? KIND_LABEL[part.kind] : 'text'}`}
              tabIndex={isFocusable ? 0 : -1}
              className={styles.segment}
              data-kind={part?.kind}
              data-selected={inSelection || undefined}
              onClick={() => select(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  select(index);
                }
              }}
            >
              {text}
            </span>
          );
        })}
      </div>

      <div className={styles.panel} aria-live="polite">
        {active ? (
          <>
            <ol className={styles.chain} aria-label="This part is inside">
              {chain.map((part) => (
                <li key={part.id}>
                  <button
                    type="button"
                    className={styles.crumb}
                    aria-pressed={part.id === active.id}
                    onClick={() => setSelected(part.id)}
                  >
                    {KIND_LABEL[part.kind]}
                  </button>
                </li>
              ))}
            </ol>
            <p className={styles.kind}>
              {KIND_LABEL[active.kind]}:{' '}
              <code>{example.source.slice(active.start, active.end)}</code>
            </p>
            <p>{describe(active, example)}</p>
          </>
        ) : (
          <p className={styles.hint}>
            Click any part of the code, or focus it and use the arrow keys.
          </p>
        )}
      </div>

      <div className={styles.rendered}>
        <p className={styles.label}>What the browser shows</p>
        <ShadowStage html={example.preview ?? example.source} className={styles.stage} inert />
      </div>
    </div>
  );
}

export default function AnatomyExplorerView({ props }: VisualizerViewProps<AnatomyExplorerProps>) {
  const [index, setIndex] = useState('0');
  const example = props.examples[Number(index)] ?? props.examples[0];
  if (!example) return null;
  return (
    <div className={styles.explorer}>
      {props.examples.length > 1 && (
        <SegmentedControl
          label="Example"
          size="sm"
          options={props.examples.map((e, i) => ({ value: String(i), label: e.label }))}
          value={index}
          onChange={setIndex}
        />
      )}
      <ExampleView key={index} example={example} />
    </div>
  );
}
