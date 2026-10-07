/**
 * grid-template-areas from a painted map of cells. Every named area must be one filled
 * rectangle; if any isn't, the browser drops the whole declaration.
 */

/** Rows of cell names; "." is an empty cell. */
export type AreaMap = string[][];

export function templateAreas(map: AreaMap): string {
  return map.map((row) => `"${row.join(' ')}"`).join('\n');
}

export function areaNames(map: AreaMap): string[] {
  return [...new Set(map.flat().filter((name) => name !== '.'))];
}

/** Names whose cells don't form a single filled rectangle. */
export function brokenAreas(map: AreaMap): string[] {
  return areaNames(map).filter((name) => {
    const cells = map.flatMap((row, r) =>
      row.flatMap((cell, c) => (cell === name ? [{ r, c }] : [])),
    );
    const rows = cells.map((x) => x.r);
    const cols = cells.map((x) => x.c);
    const [top, bottom] = [Math.min(...rows), Math.max(...rows)];
    const [left, right] = [Math.min(...cols), Math.max(...cols)];
    return (bottom - top + 1) * (right - left + 1) !== cells.length;
  });
}

export function paint(map: AreaMap, row: number, col: number, name: string): AreaMap {
  return map.map((cells, r) =>
    r === row ? cells.map((cell, c) => (c === col ? name : cell)) : cells,
  );
}
