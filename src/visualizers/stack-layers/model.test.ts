import { describe, expect, it } from 'vitest';
import { createsContext, layerTree, onTop, paintOrder, type Box } from './model.ts';

// The classic bug: a dropdown with z-index 9999 inside a header with z-index 10.
const page = (headerZ: number | 'auto', extra: Partial<Box> = {}): Box[] => [
  { id: 'page', parent: null, position: 'static', z: 'auto' },
  { id: 'header', parent: 'page', position: 'relative', z: headerZ, ...extra },
  { id: 'menu', parent: 'header', position: 'absolute', z: 9999 },
  { id: 'card', parent: 'page', position: 'relative', z: 20 },
];

describe('createsContext', () => {
  it('needs a position and a z-index, or one of the other triggers', () => {
    expect(createsContext({ id: 'a', parent: 'p', position: 'relative', z: 'auto' })).toBe(false);
    expect(createsContext({ id: 'a', parent: 'p', position: 'relative', z: 0 })).toBe(true);
    expect(
      createsContext({ id: 'a', parent: 'p', position: 'static', z: 'auto', opacity: 0.9 }),
    ).toBe(true);
    expect(createsContext({ id: 'a', parent: 'p', position: 'sticky', z: 'auto' })).toBe(true);
  });
});

// Each expectation matches what Chromium's elementFromPoint returned for the same page.
describe('onTop', () => {
  it('traps the 9999 inside the header context', () => {
    expect(onTop(page(10), 'menu', 'card')).toBe('card');
  });

  it('lets the menu win once the header context is above the card', () => {
    expect(onTop(page(30), 'menu', 'card')).toBe('menu');
  });

  it('lets the menu compete directly when the header makes no context', () => {
    expect(onTop(page('auto'), 'menu', 'card')).toBe('menu');
  });

  it('traps it again when opacity makes the header a context', () => {
    expect(onTop(page('auto', { opacity: 0.99 }), 'menu', 'card')).toBe('card');
  });
});

describe('paintOrder', () => {
  it('nests the menu inside the header context', () => {
    const menu = paintOrder(page(10)).find((l) => l.id === 'menu');
    expect(menu?.contexts).toEqual(['page', 'header']);
  });
});

describe('layerTree', () => {
  it('lists each context with its members, top first', () => {
    expect(layerTree(page(10))).toEqual({
      id: 'page',
      members: [
        { id: 'card', members: [] },
        { id: 'header', members: [{ id: 'menu', members: [] }] },
      ],
    });
  });
});
