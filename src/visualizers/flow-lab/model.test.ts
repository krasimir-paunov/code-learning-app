import { describe as group, expect, it } from 'vitest';
import { describe, rulesFor } from './model.ts';

group('rulesFor', () => {
  it('inline ignores size and vertical margins', () => {
    expect(rulesFor('inline', 'visible')).toMatchObject({
      ownLine: false,
      sizeApplies: false,
      verticalMargins: false,
    });
  });

  it('inline-block keeps the line but honours size', () => {
    expect(rulesFor('inline-block', 'visible')).toMatchObject({
      ownLine: false,
      sizeApplies: true,
    });
  });

  it('block takes its own line', () => {
    expect(rulesFor('block', 'visible').ownLine).toBe(true);
  });

  it('display: none removes the box; visibility: hidden keeps the space', () => {
    expect(rulesFor('none', 'visible')).toMatchObject({ takesSpace: false, visible: false });
    expect(rulesFor('block', 'hidden')).toMatchObject({ takesSpace: true, visible: false });
  });
});

group('describe', () => {
  it('says what happens in words', () => {
    expect(describe('none', 'hidden')).toContain('Gone');
    expect(describe('inline', 'hidden')).toContain('its space stays');
  });
});
