/**
 * How a box paints its surface: from the bottom up, the outer shadow, the background colour, the
 * background images (gradients are images), the border, then the content. `border-radius`
 * shapes every one of those layers.
 */

export const LAYERS = ['box-shadow', 'background-color', 'background-image', 'border'] as const;

export type Layer = (typeof LAYERS)[number];

export type Surface = Record<Layer, string> & { 'border-radius': string };

export type Enabled = Record<Layer, boolean>;

/** The declarations for the whole card, leaving out switched-off layers. */
export function cardDeclarations(surface: Surface, enabled: Enabled): string[] {
  return [
    `border-radius: ${surface['border-radius']}`,
    ...LAYERS.filter((layer) => enabled[layer]).map((layer) => `${layer}: ${surface[layer]}`),
  ];
}

/** The border's width, so layers without the border can still line up with it. */
export function borderWidth(surface: Surface): string {
  return /(\d*\.?\d+px)/.exec(surface.border)?.[1] ?? '0px';
}

/**
 * One layer on its own, for the exploded view. The border keeps its width on every layer (as
 * transparent) so all layers line up and the backgrounds show how far they reach under it.
 */
export function layerDeclarations(layer: Layer, surface: Surface): string[] {
  const base = [
    `border-radius: ${surface['border-radius']}`,
    `border: ${borderWidth(surface)} solid transparent`,
  ];
  return layer === 'border'
    ? [...base, `border: ${surface.border}`]
    : [...base, `${layer}: ${surface[layer]}`];
}

export function toCss(declarations: readonly string[]): string {
  return declarations.map((d) => `${d};`).join(' ');
}
