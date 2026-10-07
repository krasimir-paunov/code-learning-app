/**
 * Grid placement by lines: a rectangle of cells becomes start and end lines on each axis, which
 * CSS can write three ways: both line numbers, a start plus `span`, or counting back from the
 * end of the explicit grid with negative numbers.
 */

export interface Cell {
  row: number;
  col: number;
}

/** Lines are 1-based; the end line is the one after the last covered track. */
export interface Area {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

export function areaFrom(a: Cell, b: Cell): Area {
  return {
    colStart: Math.min(a.col, b.col),
    colEnd: Math.max(a.col, b.col) + 1,
    rowStart: Math.min(a.row, b.row),
    rowEnd: Math.max(a.row, b.row) + 1,
  };
}

export function covers(area: Area, cell: Cell): boolean {
  return (
    cell.col >= area.colStart &&
    cell.col < area.colEnd &&
    cell.row >= area.rowStart &&
    cell.row < area.rowEnd
  );
}

/** Line n counted back from the end: in a grid of `tracks` tracks, line tracks + 1 is −1. */
export function negativeLine(line: number, tracks: number): number {
  return line - (tracks + 2);
}

export interface Forms {
  lines: [string, string];
  span: [string, string];
  negative: [string, string];
}

/** The same placement written three ways, as [grid-column, grid-row] values. */
export function forms(area: Area, cols: number, rows: number): Forms {
  return {
    lines: [`${area.colStart} / ${area.colEnd}`, `${area.rowStart} / ${area.rowEnd}`],
    span: [
      `${area.colStart} / span ${area.colEnd - area.colStart}`,
      `${area.rowStart} / span ${area.rowEnd - area.rowStart}`,
    ],
    negative: [
      `${area.colStart} / ${negativeLine(area.colEnd, cols)}`,
      `${area.rowStart} / ${negativeLine(area.rowEnd, rows)}`,
    ],
  };
}
