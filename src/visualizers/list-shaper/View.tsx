import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../../components/IconButton.tsx';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { ListShaperProps } from './build.ts';
import {
  indent,
  maxDepthAt,
  move,
  normalize,
  summarize,
  toHtml,
  type Item,
  type ListKind,
  type ListSummary,
} from './model.ts';
import styles from './View.module.css';

const KIND_LABEL: Record<ListKind, string> = { ul: '<ul>', ol: '<ol>', dl: '<dl>' };

function Summary({ summary, parent }: { summary: ListSummary; parent?: string }) {
  return (
    <li>
      {parent && (
        <>
          inside <strong>{parent}</strong>:{' '}
        </>
      )}
      {summary.kind}, {summary.items} {summary.items === 1 ? 'item' : 'items'}
      {summary.nested.length > 0 && (
        <ul>
          {summary.nested.map((n, i) => (
            <Summary key={i} summary={n.summary} parent={n.parent} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ListShaperView({ props }: VisualizerViewProps<ListShaperProps>) {
  const [presetIndex, setPresetIndex] = useState('0');
  const preset = props.presets[Number(presetIndex)] ?? props.presets[0];
  const [kind, setKind] = useState<ListKind>(preset?.kind ?? 'ul');
  const [nestedKind, setNestedKind] = useState<'ul' | 'ol'>(preset?.nestedKind ?? 'ul');
  const [items, setItems] = useState<Item[]>(preset?.items ?? []);
  const [status, setStatus] = useState('');

  const loadPreset = (value: string) => {
    const next = props.presets[Number(value)];
    if (!next) return;
    setPresetIndex(value);
    setKind(next.kind);
    setNestedKind(next.nestedKind);
    setItems(next.items);
    setStatus('');
  };

  const label = (item: Item) => {
    if (kind === 'dl') return item.depth === 0 ? 'term' : 'description';
    return item.depth === 0 ? 'top level' : `nested, level ${item.depth + 1}`;
  };
  const change = (next: Item[], index: number) => {
    setItems(next);
    const item = next[index];
    if (item) setStatus(`${item.text}: ${label(item)}`);
  };

  const html = toHtml(items, kind, nestedKind);
  const summary = summarize(items, kind, nestedKind);

  return (
    <div className={styles.frame}>
      {props.presets.length > 1 && (
        <SegmentedControl
          label="Start from"
          size="sm"
          options={props.presets.map((p, i) => ({ value: String(i), label: p.label }))}
          value={presetIndex}
          onChange={loadPreset}
        />
      )}
      <div className={styles.lab}>
        <div className={styles.controls}>
          <div className={styles.kinds}>
            <SegmentedControl<ListKind>
              label="List"
              size="sm"
              options={(['ul', 'ol', 'dl'] as const).map((k) => ({
                value: k,
                label: KIND_LABEL[k],
              }))}
              value={kind}
              onChange={(k) => {
                setKind(k);
                setItems((all) => normalize(all, k));
              }}
            />
            {kind !== 'dl' && (
              <SegmentedControl<'ul' | 'ol'>
                label="Nested lists"
                size="sm"
                options={[
                  { value: 'ul', label: '<ul>' },
                  { value: 'ol', label: '<ol>' },
                ]}
                value={nestedKind}
                onChange={setNestedKind}
              />
            )}
          </div>

          <ol className={styles.items} aria-label="Items">
            {items.map((item, index) => (
              <li
                key={`${item.text}-${index}`}
                className={styles.item}
                style={{ ['--depth' as string]: item.depth }}
                data-term={kind === 'dl' && item.depth === 0 ? true : undefined}
              >
                <span className={styles.itemText}>
                  <span className={styles.itemTag}>
                    {kind === 'dl' ? (item.depth === 0 ? 'dt' : 'dd') : 'li'}
                  </span>{' '}
                  {item.text}
                  <span className="visually-hidden">, {label(item)}</span>
                </span>
                <span className={styles.buttons}>
                  <IconButton
                    label={`Outdent ${item.text}`}
                    icon={<ArrowLeft />}
                    disabled={item.depth === 0}
                    onClick={() => change(indent(items, index, -1, kind), index)}
                  />
                  <IconButton
                    label={`Indent ${item.text}`}
                    icon={<ArrowRight />}
                    disabled={item.depth >= maxDepthAt(items, index, kind)}
                    onClick={() => change(indent(items, index, 1, kind), index)}
                  />
                  <IconButton
                    label={`Move ${item.text} up`}
                    icon={<ArrowUp />}
                    disabled={index === 0}
                    onClick={() => change(move(items, index, -1, kind), index - 1)}
                  />
                  <IconButton
                    label={`Move ${item.text} down`}
                    icon={<ArrowDown />}
                    disabled={index === items.length - 1}
                    onClick={() => change(move(items, index, 1, kind), index + 1)}
                  />
                </span>
              </li>
            ))}
          </ol>
          <p className="visually-hidden" aria-live="polite">
            {status}
          </p>
        </div>

        <div className={styles.outputs}>
          <section className={styles.output} aria-label="Rendered">
            <h3 className={styles.outputTitle}>Rendered</h3>
            <ShadowStage html={html} className={styles.stage} inert />
          </section>
          <section className={styles.output} aria-label="What assistive technology gets">
            <h3 className={styles.outputTitle}>What assistive technology gets</h3>
            <ul className={styles.summary}>
              <Summary summary={summary} />
            </ul>
          </section>
          <section className={styles.output}>
            <h3 className={styles.outputTitle}>Markup</h3>
            <pre className={styles.markup} role="region" aria-label="Markup" tabIndex={0}>
              <code>{html}</code>
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
