import { describe, expect, it } from 'vitest';
import { grid, headersFor as refsFor, markup, type Cell, type TableData } from './model.ts';

const headersFor = (cells: Cell[][], row: number, col: number) => {
  const found = refsFor(cells, row, col);
  return { column: found.column.map((h) => h.text), row: found.row.map((h) => h.text) };
};

const data: TableData = {
  caption: 'Trail shoes compared',
  columns: ['Shoe', 'Weight', 'Price'],
  rows: [
    { header: 'Ridgeline', values: ['280 g', '$129'] },
    { header: 'Summit', values: ['310 g', '$149'] },
  ],
};
const all = { caption: true, columnHeaders: true, rowHeaders: true };
const none = { caption: false, columnHeaders: false, rowHeaders: false };

describe('headersFor', () => {
  it('links a data cell to its column and row headers', () => {
    expect(headersFor(grid(data, all), 2, 1)).toEqual({ column: ['Weight'], row: ['Summit'] });
  });

  it('finds nothing in a table made only of td', () => {
    expect(headersFor(grid(data, none), 2, 1)).toEqual({ column: [], row: [] });
  });

  it('gives a row header its column header', () => {
    expect(headersFor(grid(data, all), 1, 0)).toEqual({ column: ['Shoe'], row: [] });
  });
});

describe('header positions', () => {
  it('points at the header cells', () => {
    expect(refsFor(grid(data, all), 2, 1)).toEqual({
      column: [{ text: 'Weight', row: 0, col: 1 }],
      row: [{ text: 'Summit', row: 2, col: 0 }],
    });
  });
});

describe('markup', () => {
  it('writes caption, thead and scoped headers', () => {
    expect(markup(data, all)).toBe(
      [
        '<table>',
        '  <caption>Trail shoes compared</caption>',
        '  <thead>',
        '    <tr><th scope="col">Shoe</th><th scope="col">Weight</th><th scope="col">Price</th></tr>',
        '  </thead>',
        '  <tbody>',
        '    <tr><th scope="row">Ridgeline</th><td>280 g</td><td>$129</td></tr>',
        '    <tr><th scope="row">Summit</th><td>310 g</td><td>$149</td></tr>',
        '  </tbody>',
        '</table>',
      ].join('\n'),
    );
  });

  it('keeps the first row in tbody when it is not a header row', () => {
    expect(markup(data, none)).toContain('  <tbody>\n    <tr><td>Shoe</td>');
  });

  it('adds per-cell attributes for the view', () => {
    expect(markup(data, none, (r, c) => ` data-cell="${r}-${c}"`)).toContain(
      '<td data-cell="1-1">280 g</td>',
    );
  });
});
