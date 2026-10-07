// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { runChecks, type Check } from './model.ts';

const checks: Check[] = [
  { kind: 'count', label: 'one h1', selector: 'h1', count: 1 },
  { kind: 'labelled', label: 'fields have labels', selector: 'input' },
  {
    kind: 'attr',
    label: 'email type',
    selector: 'input[name="email"]',
    attr: 'type',
    value: 'email',
  },
  {
    kind: 'absent',
    label: 'no positive tabindex',
    selector: '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])',
  },
  { kind: 'exists', label: 'a main', selector: 'main' },
];

const page = (html: string) => {
  document.body.innerHTML = html;
  return runChecks(document.body, checks).map((o) => (o.pass ? 'ok' : o.detail));
};

describe('runChecks', () => {
  it('passes a page that meets the spec', () => {
    expect(
      page(
        '<main><h1>Join</h1><label for="e">Email</label><input id="e" type="email" name="email"></main>',
      ),
    ).toEqual(['ok', 'ok', 'ok', 'ok', 'ok']);
  });

  it('explains each failure', () => {
    expect(
      page('<h1>A</h1><h1>B</h1><input name="email" placeholder="Email" tabindex="2">'),
    ).toEqual([
      'found 2, expected 1',
      '1 without a <label>',
      `type isn't "email"`,
      'found 1',
      'not found',
    ]);
  });

  it('survives an invalid selector', () => {
    document.body.innerHTML = '<p></p>';
    expect(
      runChecks(document.body, [{ kind: 'exists', label: 'bad', selector: '[[' }])[0]?.pass,
    ).toBe(false);
  });
});
