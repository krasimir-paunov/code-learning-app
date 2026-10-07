import { useId, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import type { GridPlacerProps } from './build.ts';
import { areaFrom, covers, forms, type Cell } from './model.ts';
import styles from './View.module.css';

const cellAt = (x: number, y: number): Cell | null => {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]');
  const [row, col] = (el?.dataset.cell ?? '').split('-').map(Number);
  return row && col ? { row, col } : null;
};

export default function GridPlacerView({ props }: VisualizerViewProps<GridPlacerProps>) {
  const hintId = useId();
  const [area, setArea] = useState(() => areaFrom(props.start.from, props.start.to));
  // While dragging (pointer) or after the first pick (keyboard): the anchor and the cell now under it.
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [current, setCurrent] = useState<Cell | null>(null);
  const [dragging, setDragging] = useState(false);

  const preview = anchor && current ? areaFrom(anchor, current) : area;
  const f = forms(preview, props.cols, props.rows);
  const template = {
    gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${props.rows}, 3.5rem)`,
  };
  const cells = Array.from({ length: props.rows }, (_, r) =>
    Array.from({ length: props.cols }, (_, c) => ({ row: r + 1, col: c + 1 })),
  ).flat();

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    setAnchor(cell);
    setCurrent(cell);
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell && (cell.row !== current?.row || cell.col !== current.col)) setCurrent(cell);
  };
  const onPointerUp = () => {
    if (!dragging || !anchor || !current) return;
    setArea(areaFrom(anchor, current));
    setAnchor(null);
    setCurrent(null);
    setDragging(false);
  };
  // Keyboard: the first Enter picks the start cell, the second the end cell.
  const onKeyPick = (cell: Cell) => {
    if (!anchor) {
      setAnchor(cell);
      setCurrent(cell);
      return;
    }
    setArea(areaFrom(anchor, cell));
    setAnchor(null);
    setCurrent(null);
  };

  return (
    <div className={styles.frame}>
      <p className={styles.hint} id={hintId}>
        Drag across the cells to place <strong>{props.feature}</strong>. With a keyboard: Tab to a
        cell, press Enter, then press Enter on the opposite corner.
      </p>
      <div className={styles.board}>
        <div className={styles.grid} style={template} aria-hidden="true">
          <div
            className={styles.feature}
            style={{ gridColumn: f.lines[0], gridRow: f.lines[1] }}
            data-preview={anchor !== null || undefined}
          >
            {props.feature}
          </div>
          {props.items.map((label) => (
            <div key={label} className={styles.item}>
              {label}
            </div>
          ))}
        </div>
        <div
          className={styles.overlay}
          style={template}
          role="group"
          aria-label="Grid cells"
          aria-describedby={hintId}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {cells.map((cell) => (
            <button
              key={`${cell.row}-${cell.col}`}
              type="button"
              className={styles.cell}
              data-cell={`${cell.row}-${cell.col}`}
              data-anchor={
                (anchor && anchor.row === cell.row && anchor.col === cell.col) || undefined
              }
              aria-pressed={covers(preview, cell)}
              aria-label={`Row ${cell.row}, column ${cell.col}`}
              onClick={(e) => {
                // Pointer clicks were handled by the drag; detail 0 means Enter or Space.
                if (e.detail === 0) onKeyPick(cell);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && anchor) {
                  setAnchor(null);
                  setCurrent(null);
                }
              }}
            />
          ))}
        </div>
      </div>

      <div className={styles.forms} aria-live="polite">
        <p className={styles.label}>
          <strong>{props.feature}</strong>, written three ways that place it on the same lines:
        </p>
        <pre className={styles.code}>
          <code>
            {`grid-column: ${f.lines[0]};    grid-row: ${f.lines[1]};\n`}
            {`grid-column: ${f.span[0]};  grid-row: ${f.span[1]};\n`}
            {`grid-column: ${f.negative[0]};   grid-row: ${f.negative[1]};`}
          </code>
        </pre>
        <p className={styles.note}>
          Lines run 1 to {props.cols + 1} across and 1 to {props.rows + 1} down; −1 is always the
          last line of the explicit grid.
        </p>
      </div>
    </div>
  );
}
