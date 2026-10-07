import { describe, expect, it } from 'vitest';
import type { Measurement } from '../../engine/runners/contract.ts';
import { evaluate, measureFor, rendersFor, runAll, withTheme, type Check } from './model.ts';

const at = (x: number, y: number, width: number, height: number): Measurement => ({
  found: true,
  box: { x, y, width, height },
});

describe('responsive-checker checks', () => {
  const twoUp = { '.a': at(0, 0, 100, 50), '.b': at(100, 0, 100, 50) };
  const stacked = { '.a': at(0, 0, 200, 50), '.b': at(0, 50, 200, 50) };

  it('tells stacked from side by side', () => {
    const s: Check = { kind: 'stacked', label: '', a: '.a', b: '.b' };
    const r: Check = { kind: 'row', label: '', a: '.a', b: '.b' };
    expect(evaluate(s, stacked, 360).pass).toBe(true);
    expect(evaluate(s, twoUp, 360).pass).toBe(false);
    expect(evaluate(r, twoUp, 360).pass).toBe(true);
    expect(evaluate(r, stacked, 360).pass).toBe(false);
  });

  it('does not count a wrapped item as side by side', () => {
    const r: Check = { kind: 'row', label: '', a: '.a', b: '.b' };
    expect(evaluate(r, { '.a': at(0, 0, 100, 50), '.b': at(120, 60, 100, 50) }, 360).pass).toBe(
      false,
    );
  });

  it('reports how far an element overflows the page', () => {
    const fits: Check = { kind: 'fits', label: '', selector: '.a' };
    expect(evaluate(fits, { '.a': at(16, 0, 400, 10) }, 360)).toEqual({
      pass: false,
      detail: '56px past the edge',
    });
    expect(evaluate(fits, { '.a': at(16, 0, 328, 10) }, 360).pass).toBe(true);
  });

  it('compares computed styles exactly', () => {
    const style: Check = {
      kind: 'style',
      label: '',
      selector: '.a',
      property: 'background-color',
      value: 'rgb(30, 41, 59)',
    };
    const measured = (v: string) => ({ '.a': { found: true, styles: { 'background-color': v } } });
    expect(evaluate(style, measured('rgb(30, 41, 59)'), 360).pass).toBe(true);
    expect(evaluate(style, measured('rgb(255, 255, 255)'), 360)).toEqual({
      pass: false,
      detail: 'rgb(255, 255, 255)',
    });
  });

  it('renders only the widths and themes the checks need', () => {
    const checks: Check[] = [
      { kind: 'fits', label: '', selector: '.a' },
      { kind: 'max-width', label: '', selector: '.a', max: 900, at: [1200], theme: 'dark' },
    ];
    expect(rendersFor(checks, [360, 1200])).toEqual([
      { width: 360, theme: 'light' },
      { width: 1200, theme: 'light' },
      { width: 1200, theme: 'dark' },
    ]);
    expect(measureFor(checks)).toEqual({ selectors: ['.a'], properties: [] });
  });

  it('leaves widths a check does not apply at empty', () => {
    const checks: Check[] = [{ kind: 'fits', label: '', selector: '.a', at: [360] }];
    const results = new Map([
      ['360:light', { '.a': at(0, 0, 300, 10) }],
      ['1200:light', { '.a': at(0, 0, 300, 10) }],
    ]);
    const [row] = runAll(checks, [360, 1200], results);
    expect([...(row?.keys() ?? [])]).toEqual([360]);
  });

  it('switches the theme on the marked root only', () => {
    expect(withTheme('<div class="site" data-theme="light">', 'dark')).toBe(
      '<div class="site" data-theme="dark">',
    );
  });
});
