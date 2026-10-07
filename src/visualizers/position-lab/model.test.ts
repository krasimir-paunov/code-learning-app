import { describe, expect, it } from 'vitest';
import { containingBlock, keepsSpace, type Ancestor } from './model.ts';

const plain: Ancestor[] = [
  { id: 'card', position: 'static' },
  { id: 'section', position: 'static' },
];

describe('containingBlock', () => {
  it('keeps relative and sticky in the flow', () => {
    expect(containingBlock('relative', plain)).toEqual({ kind: 'flow' });
    expect(containingBlock('sticky', plain)).toEqual({ kind: 'flow' });
  });

  it('gives absolute the nearest positioned ancestor', () => {
    const ancestors: Ancestor[] = [
      { id: 'card', position: 'static' },
      { id: 'section', position: 'relative' },
    ];
    expect(containingBlock('absolute', ancestors)).toEqual({ kind: 'ancestor', id: 'section' });
  });

  it('falls back to the page when no ancestor is positioned', () => {
    expect(containingBlock('absolute', plain)).toEqual({ kind: 'page' });
  });

  it('measures fixed from the viewport, even inside positioned ancestors', () => {
    expect(containingBlock('fixed', [{ id: 'card', position: 'relative' }])).toEqual({
      kind: 'viewport',
    });
  });

  it('lets a transformed ancestor capture fixed elements', () => {
    expect(
      containingBlock('fixed', [{ id: 'card', position: 'static', transformed: true }]),
    ).toEqual({
      kind: 'ancestor',
      id: 'card',
    });
  });
});

describe('keepsSpace', () => {
  it('takes absolute and fixed out of the flow', () => {
    expect(keepsSpace('relative')).toBe(true);
    expect(keepsSpace('absolute')).toBe(false);
    expect(keepsSpace('fixed')).toBe(false);
  });
});
