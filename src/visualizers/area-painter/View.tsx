import { TriangleAlert } from 'lucide-react';
import { useId, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { AreaPainterProps } from './build.ts';
import { areaNames, brokenAreas, paint, templateAreas, type AreaMap } from './model.ts';
import styles from './View.module.css';

const EMPTY = '.';

const cellAt = (x: number, y: number) => {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]');
  const [row, col] = (el?.dataset.cell ?? '').split('-').map(Number);
  return row !== undefined && col !== undefined && !Number.isNaN(row) && !Number.isNaN(col)
    ? { row, col }
    : null;
};

export default function AreaPainterView({ props }: VisualizerViewProps<AreaPainterProps>) {
  const hintId = useId();
  const [map, setMap] = useState<AreaMap>(props.map);
  const [brush, setBrush] = useState(props.palette[0]?.name ?? EMPTY);
  const [painting, setPainting] = useState(false);

  const colorOf = (name: string) => props.palette.find((p) => p.name === name)?.color;
  const cols = map[0]?.length ?? 0;
  const areas = templateAreas(map);
  const valid = CSS.supports('grid-template-areas', areas.replaceAll('\n', ' '));
  const broken = brokenAreas(map);
  const used = areaNames(map);

  const paintAt = (row: number, col: number) => {
    if (map[row]?.[col] !== brush) setMap((m) => paint(m, row, col, brush));
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    setPainting(true);
    paintAt(cell.row, cell.col);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!painting) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell) paintAt(cell.row, cell.col);
  };

  const html = `<div class="page">${used.map((name) => `<div class="area" style="grid-area:${name};background:${colorOf(name)}">${name}</div>`).join('')}</div>`;
  const css = `
    :host { color: #0f172a; color-scheme: light; }
    .page { display: grid; grid-template-columns: repeat(${cols}, 1fr); grid-auto-rows: minmax(52px, auto); gap: 6px; padding: 10px; background: #eef1f5; font: 600 14px/1.2 system-ui, sans-serif; grid-template-areas: ${areas.replaceAll('\n', ' ')}; }
    .area { display: grid; place-items: center; border-radius: 6px; }
  `;

  return (
    <div className={styles.frame}>
      <div className={styles.palette} role="group" aria-label="Paint with">
        {[...props.palette, { name: EMPTY, color: '' }].map((p) => (
          <button
            key={p.name}
            type="button"
            className={styles.swatch}
            aria-pressed={brush === p.name}
            onClick={() => setBrush(p.name)}
          >
            <span
              className={styles.dot}
              style={p.color ? { background: p.color } : undefined}
              aria-hidden="true"
            />
            <code>{p.name === EMPTY ? '. (empty)' : p.name}</code>
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.column}>
          <p className={styles.hint} id={hintId}>
            Click or drag over cells to paint them. Keyboard: Tab to a cell and press Enter.
          </p>
          <div
            className={styles.painter}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            role="group"
            aria-label="Cells"
            aria-describedby={hintId}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => setPainting(false)}
            onPointerCancel={() => setPainting(false)}
            onPointerLeave={() => setPainting(false)}
          >
            {map.map((row, r) =>
              row.map((name, c) => (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={styles.cell}
                  data-cell={`${r}-${c}`}
                  data-empty={name === EMPTY || undefined}
                  style={name !== EMPTY ? { background: colorOf(name) } : undefined}
                  aria-label={`Row ${r + 1}, column ${c + 1}: ${name === EMPTY ? 'empty' : name}`}
                  onClick={(e) => {
                    // Pointer painting already happened on pointerdown; detail 0 means Enter or Space.
                    if (e.detail === 0) paintAt(r, c);
                  }}
                >
                  {name}
                </button>
              )),
            )}
          </div>
        </div>

        <figure className={styles.preview}>
          <figcaption>The page, laid out by the browser</figcaption>
          <ShadowStage html={html} css={css} className={styles.stage} inert />
        </figure>
      </div>

      <div aria-live="polite">
        {!valid && (
          <p className={styles.warning}>
            <TriangleAlert aria-hidden="true" />
            <span>
              {broken.map((n) => `“${n}”`).join(', ') || 'An area'} isn’t a rectangle, so the
              browser throws away the whole <code>grid-template-areas</code> declaration. The{' '}
              <code>grid-area</code> names now point at areas that don’t exist, so the browser
              invents lines for them past the grid and the parts pile up in one spot.
            </span>
          </p>
        )}
      </div>

      <pre className={styles.code}>
        <code>
          {`.page {\n  display: grid;\n  grid-template-columns: repeat(${cols}, 1fr);\n  grid-template-areas:\n${areas
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n')};\n}\n`}
          {used.map((name) => `.${name} { grid-area: ${name}; }`).join('\n')}
        </code>
      </pre>
    </div>
  );
}
