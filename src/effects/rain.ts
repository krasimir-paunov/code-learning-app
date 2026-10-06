/** Glyphs come from real code tokens, not katakana: the rain is made of what you will learn. */
export const RAIN_TOKENS = [
  '{}',
  '=>',
  '<div>',
  'async',
  '0x1F',
  'const',
  '</>',
  '===',
  '?.',
  '&&',
  '[]',
  'await',
  'fn()',
  '++',
  '::',
  'let',
  '#id',
  'var',
  '0',
  '1',
  'null',
  'yield',
  '<T>',
  '??',
];

export interface RainColumn {
  /** Row of the column's head; negative while still above the screen. */
  row: number;
  /** Ticks between moves (1 = fastest). */
  slowness: number;
  tick: number;
  token: string;
  charIndex: number;
}

export interface RainGlyph {
  column: number;
  row: number;
  char: string;
}

type Random = () => number;

function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)] as T;
}

export function createRain(columns: number, rows: number, random: Random): RainColumn[] {
  return Array.from({ length: columns }, () => ({
    row: -Math.floor(random() * rows),
    slowness: 1 + Math.floor(random() * 3),
    tick: 0,
    token: pick(RAIN_TOKENS, random),
    charIndex: 0,
  }));
}

/** Advances every column one tick and returns the glyphs to draw this frame. */
export function stepRain(state: RainColumn[], rows: number, random: Random): RainGlyph[] {
  const glyphs: RainGlyph[] = [];
  state.forEach((column, index) => {
    column.tick += 1;
    if (column.tick < column.slowness) return;
    column.tick = 0;
    column.row += 1;
    if (column.row >= 0) {
      glyphs.push({ column: index, row: column.row, char: column.token[column.charIndex] ?? ' ' });
      column.charIndex = (column.charIndex + 1) % column.token.length;
      if (column.charIndex === 0) column.token = pick(RAIN_TOKENS, random);
    }
    if (column.row > rows + random() * rows * 0.5) {
      column.row = -Math.floor(random() * rows * 0.5);
      column.slowness = 1 + Math.floor(random() * 3);
    }
  });
  return glyphs;
}

/** A still field of glyphs for reduced/off effects: no motion at all. */
export function staticRain(columns: number, rows: number, random: Random): RainGlyph[] {
  const glyphs: RainGlyph[] = [];
  for (let column = 0; column < columns; column++) {
    if (random() < 0.45) continue;
    const length = 3 + Math.floor(random() * rows * 0.4);
    const start = Math.floor(random() * rows);
    let token = pick(RAIN_TOKENS, random);
    let charIndex = 0;
    for (let row = start; row < Math.min(rows, start + length); row++) {
      glyphs.push({ column, row, char: token[charIndex] ?? ' ' });
      charIndex = (charIndex + 1) % token.length;
      if (charIndex === 0) token = pick(RAIN_TOKENS, random);
    }
  }
  return glyphs;
}
