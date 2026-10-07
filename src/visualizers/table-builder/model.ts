/**
 * A small data table and the header cells the HTML table model links to each data cell. Only
 * explicit `scope` is modelled: that is what the lesson teaches, and it is unambiguous in every
 * browser.
 */

export interface TableData {
  caption: string;
  /** The top-left corner label (over the row headers), then one label per data column. */
  columns: string[];
  rows: { header: string; values: string[] }[];
}

export interface Options {
  caption: boolean;
  columnHeaders: boolean;
  rowHeaders: boolean;
}

export type Cell =
  { kind: 'th'; scope: 'col' | 'row'; text: string } | { kind: 'td'; text: string };

/** The table as rows of cells: the header row first (when used), then one row per data row. */
export function grid(data: TableData, options: Options): Cell[][] {
  const head: Cell[] = data.columns.map((text) =>
    options.columnHeaders ? { kind: 'th', scope: 'col', text } : { kind: 'td', text },
  );
  const body = data.rows.map((row): Cell[] => [
    options.rowHeaders
      ? { kind: 'th', scope: 'row', text: row.header }
      : { kind: 'td', text: row.header },
    ...row.values.map((text): Cell => ({ kind: 'td', text })),
  ]);
  return [head, ...body];
}

export interface HeaderRef {
  text: string;
  row: number;
  col: number;
}

export interface Headers {
  column: HeaderRef[];
  row: HeaderRef[];
}

/** Header cells for the cell at (row, col): `scope="col"` above it, `scope="row"` before it. */
export function headersFor(cells: Cell[][], row: number, col: number): Headers {
  const column: HeaderRef[] = [];
  for (let r = 0; r < row; r++) {
    const cell = cells[r]?.[col];
    if (cell?.kind === 'th' && cell.scope === 'col') column.push({ text: cell.text, row: r, col });
  }
  const rowHeaders: HeaderRef[] = [];
  for (let c = 0; c < col; c++) {
    const cell = cells[row]?.[c];
    if (cell?.kind === 'th' && cell.scope === 'row')
      rowHeaders.push({ text: cell.text, row, col: c });
  }
  return { column, row: rowHeaders };
}

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

function cellHtml(cell: Cell, attrs = ''): string {
  return cell.kind === 'th'
    ? `<th scope="${cell.scope}"${attrs}>${escape(cell.text)}</th>`
    : `<td${attrs}>${escape(cell.text)}</td>`;
}

/**
 * The markup the options produce. `attrs` adds attributes per cell (the view uses it to make
 * cells selectable); leave it out for the markup shown to the learner.
 */
export function markup(
  data: TableData,
  options: Options,
  attrs: (row: number, col: number) => string = () => '',
): string {
  const cells = grid(data, options);
  const [head = [], ...body] = cells;
  const tr = (row: Cell[], r: number) =>
    `    <tr>${row.map((c, i) => cellHtml(c, attrs(r, i))).join('')}</tr>`;
  return [
    '<table>',
    ...(options.caption ? [`  <caption>${escape(data.caption)}</caption>`] : []),
    ...(options.columnHeaders
      ? ['  <thead>', tr(head, 0), '  </thead>', '  <tbody>']
      : ['  <tbody>', tr(head, 0)]),
    ...body.map((row, i) => tr(row, i + 1)),
    '  </tbody>',
    '</table>',
  ].join('\n');
}
