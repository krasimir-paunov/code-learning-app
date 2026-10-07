/**
 * Small accessibility audits on rendered styles: text contrast against the background it
 * actually sits on, and whether a control ends up with a name.
 */
import { contrast, type Rgb } from '../color-lab/model.ts';

/** "rgb(1, 2, 3)" or "rgba(1, 2, 3, 0.5)" → channels and alpha. */
export function parseRgb(text: string): (Rgb & { alpha: number }) | null {
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(
    text.trim(),
  );
  if (!m) return null;
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    alpha: m[4] === undefined ? 1 : Number(m[4]),
  };
}

/** The first opaque background going up from an element: the colour its text sits on. */
export function backgroundOf(
  chain: readonly string[],
  fallback: Rgb = { r: 255, g: 255, b: 255 },
): Rgb {
  for (const value of chain) {
    const parsed = parseRgb(value);
    if (parsed && parsed.alpha >= 1) return parsed;
  }
  return fallback;
}

export function textContrast(color: string, backgrounds: readonly string[]): number | null {
  const fg = parseRgb(color);
  return fg ? contrast(fg, backgroundOf(backgrounds)) : null;
}
