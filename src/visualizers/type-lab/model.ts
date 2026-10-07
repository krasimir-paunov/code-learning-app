/**
 * Fluid font sizes: parses `font-size` values built from rem, px and vw terms, optionally wrapped
 * in clamp(), and evaluates them for a viewport width and browser text size.
 */

/** A length as a sum of terms: px + rem × root font-size + vw × viewport / 100. */
export interface Linear {
  px: number;
  rem: number;
  vw: number;
}

export interface FontSizeSpec {
  min?: Linear;
  preferred: Linear;
  max?: Linear;
}

export interface Context {
  /** Root font-size in px: the browser's text size. */
  root: number;
  viewport: number;
}

export type Phase = 'fixed' | 'fluid' | 'min' | 'max';

const TERM = /^([+-]?\d*\.?\d+)(px|rem|vw)$/;

/** "1rem + 2.5vw", "24px", "-0.5rem + 3vw" → a Linear, or null if anything else is in there. */
export function parseSum(text: string): Linear | null {
  const tokens = text
    .trim()
    .replace(/\s*([+-])\s*/g, ' $1')
    .trim()
    .split(/\s+/);
  if (tokens.length === 0 || tokens[0] === '') return null;
  const out: Linear = { px: 0, rem: 0, vw: 0 };
  for (const [i, token] of tokens.entries()) {
    // Every term after the first needs its own sign: "1rem 2vw" is not a sum.
    if (i > 0 && !/^[+-]/.test(token)) return null;
    const match = TERM.exec(token);
    if (!match) return null;
    out[match[2] as keyof Linear] += Number(match[1]);
  }
  return out;
}

/** Splits on top-level commas so `clamp(1rem, 1rem + 2vw, 3rem)` gives three parts. */
export function parseFontSize(text: string): FontSizeSpec | null {
  const value = text.trim().replace(/;$/, '').trim();
  const clamp = /^clamp\((.*)\)$/i.exec(value);
  if (!clamp) {
    const preferred = parseSum(value);
    return preferred ? { preferred } : null;
  }
  const parts = (clamp[1] ?? '').split(',');
  if (parts.length !== 3) return null;
  const [min, preferred, max] = parts.map((part) => parseSum(part));
  return min && preferred && max ? { min, preferred, max } : null;
}

export function evaluate(length: Linear, { root, viewport }: Context): number {
  return length.px + length.rem * root + (length.vw * viewport) / 100;
}

export function fontSizeAt(spec: FontSizeSpec, ctx: Context): { px: number; phase: Phase } {
  const preferred = evaluate(spec.preferred, ctx);
  const min = spec.min ? evaluate(spec.min, ctx) : -Infinity;
  const max = spec.max ? evaluate(spec.max, ctx) : Infinity;
  if (preferred < min) return { px: min, phase: 'min' };
  if (preferred > max) return { px: max, phase: 'max' };
  return { px: preferred, phase: spec.preferred.vw !== 0 ? 'fluid' : 'fixed' };
}

/** How the size reacts to the user's text-size setting, the accessibility question. */
export function followsTextSize(
  spec: FontSizeSpec,
  ctx: Context,
): 'fully' | 'partly' | 'not at all' {
  const at = (root: number) => fontSizeAt(spec, { ...ctx, root }).px;
  const base = at(16);
  const larger = at(32);
  if (larger - base < 0.01) return 'not at all';
  return Math.abs(larger - 2 * base) < 0.01 ? 'fully' : 'partly';
}
