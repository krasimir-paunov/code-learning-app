import { describe, expect, it } from 'vitest';
import { flagFor, inputMarkup } from './model.ts';

describe('flagFor', () => {
  it('maps each constraint to its ValidityState flag', () => {
    expect(flagFor({ attr: 'required' })).toBe('valueMissing');
    expect(flagFor({ attr: 'minlength', value: '3' })).toBe('tooShort');
    expect(flagFor({ attr: 'pattern', value: '[a-z]+' })).toBe('patternMismatch');
    expect(flagFor({ attr: 'max', value: '8' })).toBe('rangeOverflow');
  });

  it('only checks a format for email and url types', () => {
    expect(flagFor({ attr: 'type', value: 'email' })).toBe('typeMismatch');
    expect(flagFor({ attr: 'type', value: 'text' })).toBeNull();
  });
});

describe('inputMarkup', () => {
  it('writes boolean and valued attributes', () => {
    expect(
      inputMarkup('u', 'username', 'text', [
        { attr: 'required' },
        { attr: 'minlength', value: '3' },
      ]),
    ).toBe('<input type="text" id="u" name="username" required minlength="3">');
  });
});
