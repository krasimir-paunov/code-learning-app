// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseRules } from '../shared/css/rules.ts';
import { traceValue } from './model.ts';

document.body.innerHTML = `
  <article class="card">
    <h2>Trail Shoes</h2>
    <p class="note">Light and <a href="/x">grippy</a>.</p>
    <button>Buy</button>
  </article>`;
const root = document.querySelector('article') as Element;
const el = (selector: string) => document.querySelector(selector) as Element;
const kinds = (steps: { kind: string }[]) => steps.map((s) => s.kind);

const rules = parseRules(`
  .card { color: #ffd166; font-family: Georgia; padding: 16px; border: 1px solid; }
  .note { line-height: 1.6; }
`);

describe('traceValue', () => {
  it('finds a value inherited from an ancestor', () => {
    const steps = traceValue(el('.note'), root, rules, 'color');
    expect(kinds(steps)).toEqual(['passes', 'declared']);
    expect(steps.at(-1)).toMatchObject({ selector: '.card', value: '#ffd166' });
  });

  it('stops at elements the browser styles itself: links keep their colour', () => {
    expect(kinds(traceValue(el('a'), root, rules, 'color'))).toEqual(['browser']);
    expect(kinds(traceValue(el('button'), root, rules, 'font-family'))).toEqual(['browser']);
  });

  it('does not inherit non-inherited properties', () => {
    expect(kinds(traceValue(el('.note'), root, rules, 'padding'))).toEqual(['not-inherited']);
    expect(kinds(traceValue(root, root, rules, 'padding'))).toEqual(['declared']);
  });

  it('applies inherit, initial, unset and revert', () => {
    const withKeyword = (keyword: string, property: string) =>
      parseRules(`.card { color: #ffd166; padding: 16px; } button { ${property}: ${keyword}; }`);
    expect(kinds(traceValue(el('button'), root, withKeyword('inherit', 'color'), 'color'))).toEqual(
      ['keyword', 'declared'],
    );
    expect(kinds(traceValue(el('button'), root, withKeyword('initial', 'color'), 'color'))).toEqual(
      ['keyword', 'initial'],
    );
    expect(kinds(traceValue(el('button'), root, withKeyword('unset', 'color'), 'color'))).toEqual([
      'keyword',
      'declared',
    ]);
    expect(
      kinds(traceValue(el('button'), root, withKeyword('unset', 'padding'), 'padding')),
    ).toEqual(['keyword', 'initial']);
    expect(kinds(traceValue(el('button'), root, withKeyword('revert', 'color'), 'color'))).toEqual([
      'keyword',
      'browser',
    ]);
  });

  it('falls back to the default when nothing sets an inherited property', () => {
    expect(kinds(traceValue(el('.note'), root, rules, 'letter-spacing'))).toEqual([
      'passes',
      'passes',
      'initial',
    ]);
  });
});
