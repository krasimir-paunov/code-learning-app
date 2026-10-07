import { describe, expect, it } from 'vitest';
import { cardDeclarations, LAYERS, layerDeclarations, toCss, type Surface } from './model.ts';

const surface: Surface = {
  'border-radius': '16px',
  'box-shadow': '0 8px 24px rgb(0 0 0 / 0.3)',
  'background-color': 'navy',
  'background-image': 'linear-gradient(white, transparent)',
  border: '4px dashed gold',
};

const all = {
  'box-shadow': true,
  'background-color': true,
  'background-image': true,
  border: true,
};

describe('LAYERS', () => {
  it('lists the paint order from the bottom up', () => {
    expect(LAYERS).toEqual(['box-shadow', 'background-color', 'background-image', 'border']);
  });
});

describe('cardDeclarations', () => {
  it('keeps the radius and drops switched-off layers', () => {
    expect(cardDeclarations(surface, { ...all, 'box-shadow': false })).toEqual([
      'border-radius: 16px',
      'background-color: navy',
      'background-image: linear-gradient(white, transparent)',
      'border: 4px dashed gold',
    ]);
  });
});

describe('layerDeclarations', () => {
  it('gives every layer the same border width so the layers line up', () => {
    expect(layerDeclarations('background-color', surface)).toEqual([
      'border-radius: 16px',
      'border: 4px solid transparent',
      'background-color: navy',
    ]);
  });

  it('draws the real border on the border layer', () => {
    expect(layerDeclarations('border', surface).at(-1)).toBe('border: 4px dashed gold');
  });
});

describe('toCss', () => {
  it('joins declarations', () => {
    expect(toCss(['a: 1', 'b: 2'])).toBe('a: 1; b: 2;');
  });
});
