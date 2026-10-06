import { describe, expect, it } from 'vitest';
import { resolveEffects } from './motion.ts';

describe('resolveEffects', () => {
  it('follows the system preference when set to system', () => {
    expect(resolveEffects('system', false)).toBe('full');
    expect(resolveEffects('system', true)).toBe('reduced');
  });

  it('lets an explicit setting override the system', () => {
    expect(resolveEffects('full', true)).toBe('full');
    expect(resolveEffects('reduced', false)).toBe('reduced');
    expect(resolveEffects('off', false)).toBe('off');
  });
});
