import { useEffect, useState } from 'react';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { TableBuilderProps } from './build.ts';
import { grid, headersFor, markup, type Options } from './model.ts';
import styles from './View.module.css';

const TABLE_CSS = `
  :host { color: CanvasText; color-scheme: light; }
  .page { padding: 12px; background: Canvas; overflow-x: auto; }
  table { border-collapse: collapse; font: 15px/1.4 system-ui, sans-serif; }
  caption { margin-bottom: 6px; font-weight: 700; text-align: start; }
  th, td { padding: 6px 10px; border: 1px solid #9ca3af; text-align: start; }
  th { background: #e5e7eb; }
  [data-pick] { cursor: pointer; }
  [data-pick]:hover { background: #eff6ff; }
  [data-pick]:focus-visible { outline: 3px solid #2563eb; outline-offset: -3px; }
`;

const cellKey = (row: number, col: number) => `${row}-${col}`;

export default function TableBuilderView({ props }: VisualizerViewProps<TableBuilderProps>) {
  const [options, setOptions] = useState<Options>({
    caption: false,
    columnHeaders: false,
    rowHeaders: false,
  });
  // Start on the second row so the first look at a bare value is the middle of the table.
  const [selected, setSelected] = useState({ row: 2, col: 1 });
  const [root, setRoot] = useState<ShadowRoot | null>(null);

  // Value cells are picked by click, or by Enter/Space when focused.
  useEffect(() => {
    if (!root) return;
    const pick = (event: Event) => {
      const cell = (event.target as Element).closest<HTMLElement>('[data-pick]');
      const [row, col] = (cell?.dataset.pick ?? '').split('-').map(Number);
      if (!row || !col) return false;
      setSelected({ row, col });
      return true;
    };
    const click = (event: Event) => void pick(event);
    const key = (event: KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && pick(event)) event.preventDefault();
    };
    root.addEventListener('click', click);
    root.addEventListener('keydown', key as EventListener);
    return () => {
      root.removeEventListener('click', click);
      root.removeEventListener('keydown', key as EventListener);
    };
  }, [root]);
  const set = (key: keyof Options) => (value: boolean) =>
    setOptions((o) => ({ ...o, [key]: value }));

  const cells = grid(props, options);
  const headers = headersFor(cells, selected.row, selected.col);
  const value = cells[selected.row]?.[selected.col]?.text ?? '';
  const linked = [...headers.column, ...headers.row];

  // Only value cells (not the first row or column) can be picked.
  const html = `<div class="page">${markup(props, options, (row, col) =>
    row > 0 && col > 0
      ? ` data-pick="${cellKey(row, col)}" tabindex="0"`
      : ` data-cell="${cellKey(row, col)}"`,
  )}</div>`;
  const css = [
    TABLE_CSS,
    `[data-pick="${cellKey(selected.row, selected.col)}"] { background: #bfdbfe; font-weight: 700; }`,
    ...linked.map(
      (h) =>
        `[data-cell="${cellKey(h.row, h.col)}"] { background: #fde68a; box-shadow: inset 0 0 0 2px #b45309; }`,
    ),
  ].join('\n');

  return (
    <div className={styles.frame}>
      <div className={styles.toggles}>
        <Toggle label="<caption>" checked={options.caption} onChange={set('caption')} />
        <Toggle
          label='Column headers: <th scope="col"> in <thead>'
          checked={options.columnHeaders}
          onChange={set('columnHeaders')}
        />
        <Toggle
          label='Row headers: <th scope="row">'
          checked={options.rowHeaders}
          onChange={set('rowHeaders')}
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.column}>
          <ShadowStage
            html={html}
            css={css}
            className={styles.stage}
            label="Table: click a value to see its headers"
            onRender={(r) => setRoot((current) => (current === r ? current : r))}
          />
          <p className={styles.hint}>Click any value, or Tab to it and press Enter.</p>
        </div>

        <section
          className={styles.announce}
          aria-live="polite"
          aria-label="What the table tells assistive technology"
        >
          <h3 className={styles.title}>What comes with “{value}”</h3>
          {linked.length === 0 ? (
            <p>
              <strong>Nothing.</strong> A screen reader reads only “{value}”. Which{' '}
              {props.columns[0]?.toLowerCase() ?? 'row'}? Which column?
            </p>
          ) : (
            <dl className={styles.headers}>
              <div>
                <dt>Column header</dt>
                <dd>{headers.column.map((h) => h.text).join(', ') || 'none'}</dd>
              </div>
              <div>
                <dt>Row header</dt>
                <dd>{headers.row.map((h) => h.text).join(', ') || 'none'}</dd>
              </div>
            </dl>
          )}
          <p className={styles.name}>
            Table name:{' '}
            {options.caption ? <strong>{props.caption}</strong> : <span>none (no caption)</span>}
          </p>
        </section>
      </div>

      <figure className={styles.code}>
        <figcaption>The markup</figcaption>
        <pre>
          <code>{markup(props, options)}</code>
        </pre>
      </figure>
    </div>
  );
}
