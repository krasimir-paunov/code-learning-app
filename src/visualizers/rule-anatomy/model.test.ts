import { describe, expect, it } from 'vitest';
import { checkRule, stageCss, toCss, type BrowserChecks } from './model.ts';

/** A tiny stand-in for CSS.supports and the selector parser. */
const checks: BrowserChecks = {
  supports: (property, value) =>
    ({ color: ['inherit', 'tomato', 'red'], 'font-weight': ['inherit', '700', 'bold'] })[
      property as 'color'
    ]?.includes(value) ?? false,
  parses: (selector) => !/[{}]|^\d/.test(selector),
};

describe('checkRule', () => {
  it('applies known properties with valid values', () => {
    const report = checkRule('.price', [{ property: 'color', value: 'tomato' }], checks);
    expect(report.selectorValid).toBe(true);
    expect(report.declarations[0]?.status).toBe('applied');
  });

  it('ignores unknown properties and invalid values, one declaration at a time', () => {
    const report = checkRule(
      'p',
      [
        { property: 'colour', value: 'red' },
        { property: 'color', value: '20px' },
        { property: 'font-weight', value: 'bold' },
        { property: 'color', value: '' },
      ],
      checks,
    );
    expect(report.declarations.map((d) => d.status)).toEqual([
      'unknown-property',
      'invalid-value',
      'applied',
      'empty',
    ]);
  });

  it('accepts any custom property name', () => {
    expect(
      checkRule('p', [{ property: '--brand', value: 'x' }], { ...checks, supports: () => true })
        .declarations[0]?.status,
    ).toBe('applied');
  });
});

describe('stageCss', () => {
  it('drops the whole rule when the selector is invalid', () => {
    const report = checkRule('1p', [{ property: 'color', value: 'red' }], checks);
    expect(report.selectorValid).toBe(false);
    expect(stageCss(report, '1p')).toBe('');
  });

  it('applies only the surviving declarations, plus the match outline', () => {
    const report = checkRule(
      'p',
      [
        { property: 'colour', value: 'red' },
        { property: 'color', value: 'red' },
      ],
      checks,
    );
    expect(stageCss(report, 'p').split('\n')[0]).toBe('p { color: red; }');
  });
});

describe('toCss', () => {
  it('writes the rule as typed', () => {
    expect(toCss('h2', [{ property: 'color', value: 'red' }])).toBe('h2 {\n  color: red;\n}');
  });
});
