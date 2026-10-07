import { describe, expect, it } from 'vitest';
import { liveness, speak } from './model.ts';

describe('speak', () => {
  it('puts name, role and states first, then the description', () => {
    expect(
      speak({
        role: 'button',
        name: 'Menu',
        description: 'Opens the site menu.',
        states: ['collapsed'],
      }),
    ).toBe('Menu, button, collapsed. Opens the site menu.');
  });

  it('leaves the name out for regions that need none', () => {
    expect(speak({ role: 'status', name: '', description: '', states: [] })).toBe('status');
  });

  it('says when a control has no name', () => {
    expect(speak({ role: 'button', name: '', description: '', states: [] })).toBe(
      '(no name), button',
    );
  });
});

describe('liveness', () => {
  it('reads explicit aria-live first', () => {
    expect(liveness('status', 'off')).toBeNull();
    expect(liveness(null, 'assertive')).toBe('assertive');
  });

  it('knows the roles that imply a live region', () => {
    expect(liveness('status', null)).toBe('polite');
    expect(liveness('alert', null)).toBe('assertive');
    expect(liveness(null, null)).toBeNull();
  });
});
