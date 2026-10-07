import { describe, expect, it } from 'vitest';
import { keyboardFor, LAYOUTS } from './model.ts';

describe('keyboardFor', () => {
  it('follows the type by default', () => {
    expect(keyboardFor('email')).toBe('email');
    expect(keyboardFor('tel')).toBe('tel');
    expect(keyboardFor('text')).toBe('letters');
    expect(keyboardFor('date')).toBe('picker');
  });

  it('lets inputmode override the keyboard of text fields', () => {
    expect(keyboardFor('text', 'numeric')).toBe('digits');
  });

  it('ignores inputmode on controls that take no typed text', () => {
    expect(keyboardFor('checkbox', 'numeric')).toBe('none');
  });
});

describe('LAYOUTS', () => {
  it('has keys for every keyboard that types', () => {
    for (const kind of ['letters', 'email', 'url', 'search', 'tel', 'digits', 'decimal'] as const) {
      expect(LAYOUTS[kind]?.length).toBe(4);
    }
  });

  it('puts @ on the email keyboard only', () => {
    expect(LAYOUTS.email?.flat()).toContain('@');
    expect(LAYOUTS.letters?.flat()).not.toContain('@');
  });
});
