import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.join(import.meta.dirname, 'tokens.css'), 'utf8');

/** Last declaration wins, like the cascade for these flat :root blocks. */
const declarations = new Map<string, string>();
for (const [, name = '', value = ''] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  declarations.set(name, value.trim());
}

function resolve(name: string, depth = 0): string {
  const value = declarations.get(name);
  if (value === undefined) throw new Error(`Unknown token ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  if (ref && depth < 10) return resolve(ref, depth + 1);
  return value;
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi = 0, lo = 0] = [luminance(resolve(a)), luminance(resolve(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ['--bg-0', '--bg-1', '--bg-2', '--bg-3'];

describe('design tokens meet WCAG 2.2 AA contrast', () => {
  it.each(['--text-1', '--text-2', '--text-3'])('%s is ≥ 4.5:1 on every surface', (text) => {
    for (const bg of SURFACES) expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    '--neon-cyan',
    '--neon-green',
    '--neon-magenta',
    '--neon-amber',
    '--neon-red',
    '--neon-violet',
    '--track-html',
    '--track-css',
    '--track-js',
    '--track-algo',
    '--track-cs',
    '--track-net',
  ])('%s is ≥ 4.5:1 on every surface (usable as text)', (accent) => {
    for (const bg of SURFACES) expect(contrast(accent, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('functional borders and the focus ring are ≥ 3:1 on every surface', () => {
    for (const bg of SURFACES) {
      expect(contrast('--border-strong', bg)).toBeGreaterThanOrEqual(3);
      expect(contrast('--focus-ring', bg)).toBeGreaterThanOrEqual(3);
    }
  });

  it('text on filled accent buttons is ≥ 4.5:1', () => {
    for (const fill of ['--neon-cyan', '--neon-green', '--neon-magenta', '--neon-red']) {
      expect(contrast('--text-on-accent', fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([
    '--code-fg',
    '--code-keyword',
    '--code-string',
    '--code-number',
    '--code-function',
    '--code-property',
    '--code-tag',
    '--code-attribute',
    '--code-comment',
    '--code-punctuation',
    '--code-type',
  ])('syntax color %s is ≥ 4.5:1 on the code background', (token) => {
    expect(contrast(token, '--code-bg')).toBeGreaterThanOrEqual(4.5);
  });
});
