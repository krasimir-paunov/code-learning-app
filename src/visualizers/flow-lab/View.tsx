import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { FlowLabProps } from './build.ts';
import { describe, rulesFor, type Display, type Visibility } from './model.ts';
import styles from './View.module.css';

const DISPLAYS: readonly Display[] = ['inline', 'inline-block', 'block', 'none'];
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

interface ItemState {
  display: Display;
  visibility: Visibility;
}

function Fact({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={styles.fact} data-ok={ok || undefined}>
      {ok ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
      <span>
        {children}
        <span className="visually-hidden">{ok ? ': yes' : ': no'}</span>
      </span>
    </li>
  );
}

export default function FlowLabView({ props }: VisualizerViewProps<FlowLabProps>) {
  const items = props.sentence.filter((p) => typeof p !== 'string');
  const [state, setState] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, { display: item.display, visibility: 'visible' }]),
    ),
  );
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const set = (id: string, patch: Partial<ItemState>) =>
    setState((s) => ({ ...s, [id]: { ...(s[id] as ItemState), ...patch } }));

  const html = `<p>${props.sentence
    .map((part) =>
      typeof part === 'string'
        ? escape(part)
        : `<span class="item" data-item="${part.id}">${escape(part.text)}</span>`,
    )
    .join('')}</p>`;
  const css = [
    `.item { ${props.itemCss} }`,
    ...items.map((item) => {
      const s = state[item.id];
      return `[data-item="${item.id}"] { display: ${s?.display}; visibility: ${s?.visibility}; }`;
    }),
    '.item { outline: 2px dashed var(--accent); outline-offset: -2px; }',
    'p { margin: 0; line-height: 1.6; }',
  ].join('\n');

  return (
    <div className={styles.frame}>
      <ShadowStage
        html={html}
        css={css}
        className={styles.stage}
        inert
        onRender={(root) => {
          const next = Object.fromEntries(
            Array.from(root.querySelectorAll<HTMLElement>('[data-item]'), (el) => {
              const r = el.getBoundingClientRect();
              return [el.dataset.item ?? '', `${Math.round(r.width)} × ${Math.round(r.height)}px`];
            }),
          );
          setSizes((s) => (JSON.stringify(s) === JSON.stringify(next) ? s : next));
        }}
      />
      <p className={styles.note}>
        Every phrase has <code>{props.itemCss}</code>
      </p>

      <ul className={styles.items}>
        {items.map((item) => {
          const s = state[item.id] ?? { display: 'inline', visibility: 'visible' };
          const rules = rulesFor(s.display, s.visibility);
          return (
            <li key={item.id} className={styles.item}>
              <p className={styles.itemTitle}>“{item.text}”</p>
              <SegmentedControl<Display>
                label={`display of “${item.text}”`}
                hideLabel
                size="sm"
                options={DISPLAYS.map((d) => ({ value: d, label: d }))}
                value={s.display}
                onChange={(display) => set(item.id, { display })}
              />
              <Toggle
                label="visibility: hidden"
                checked={s.visibility === 'hidden'}
                onChange={(hidden) => set(item.id, { visibility: hidden ? 'hidden' : 'visible' })}
              />
              <ul className={styles.facts}>
                <Fact ok={rules.sizeApplies}>width and height apply</Fact>
                <Fact ok={rules.ownLine}>own line</Fact>
                <Fact ok={rules.takesSpace}>takes space</Fact>
                <Fact ok={rules.visible}>visible</Fact>
              </ul>
              <p className={styles.measured} aria-live="polite">
                {describe(s.display, s.visibility)} Measured box: {sizes[item.id] ?? '…'}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
