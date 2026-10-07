import { describe, expect, it } from 'vitest';
import { describeSource, fallbacks, resolveVar, rulesCss, type VarRule } from './model.ts';

const rules: VarRule[] = [
  {
    selector: '.app',
    declarations: [
      { name: '--accent', value: 'blue', enabled: true },
      { name: '--radius', value: '8px', enabled: true },
    ],
  },
  {
    selector: '.app[data-theme="dark"]',
    declarations: [{ name: '--accent', value: 'skyblue', enabled: true }],
  },
  { selector: '.promo', declarations: [{ name: '--accent', value: 'red', enabled: true }] },
];

// button inside .promo inside .app (dark)
const promoButton = [[], [2], [0, 1]];
const plainButton = [[], [], [0, 1]];

describe('resolveVar', () => {
  it('finds the nearest declaration up the tree', () => {
    expect(resolveVar('--accent', promoButton, rules)).toEqual({
      kind: 'inherited',
      value: 'red',
      selector: '.promo',
      depth: 1,
    });
  });

  it('lets the later, stronger rule on the same element win', () => {
    expect(resolveVar('--accent', plainButton, rules)).toMatchObject({
      value: 'skyblue',
      selector: '.app[data-theme="dark"]',
    });
  });

  it('reports declarations on the element itself as own', () => {
    expect(resolveVar('--accent', [[2]], rules)).toMatchObject({ kind: 'own', value: 'red' });
  });

  it('skips switched-off declarations', () => {
    const off = rules.map((r, i) =>
      i === 2 ? { ...r, declarations: r.declarations.map((d) => ({ ...d, enabled: false })) } : r,
    );
    expect(resolveVar('--accent', promoButton, off)).toMatchObject({ value: 'skyblue' });
  });

  it('is unset when nothing declares it', () => {
    expect(resolveVar('--gap', promoButton, rules)).toEqual({ kind: 'unset' });
  });
});

describe('rulesCss', () => {
  it('writes only enabled declarations', () => {
    const css = rulesCss([
      {
        selector: '.a',
        declarations: [
          { name: '--x', value: '1px', enabled: true },
          { name: '--y', value: '2px', enabled: false },
        ],
      },
    ]);
    expect(css).toBe('.a {\n  --x: 1px;\n}');
  });
});

describe('fallbacks', () => {
  it('finds each variable and its fallback', () => {
    const found = fallbacks(
      'button { background: var(--accent, #6b7280); border-radius: var(--radius); }',
    );
    expect([...found]).toEqual([
      ['--accent', '#6b7280'],
      ['--radius', undefined],
    ]);
  });
});

describe('describeSource', () => {
  it('names the fallback when nothing is set', () => {
    expect(describeSource({ kind: 'unset' }, '#6b7280')).toBe(
      'not set, so the fallback #6b7280 is used',
    );
  });
});
