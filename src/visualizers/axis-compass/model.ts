/**
 * Flexbox axes in a left-to-right, top-to-bottom page: `flex-direction` sets the main axis,
 * and the cross axis runs across it. `justify-content` works along the main axis,
 * `align-items` along the cross axis.
 */

export type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse';

export type Arrow = 'right' | 'left' | 'down' | 'up';

export const DIRECTION_FOR: Record<Arrow, Direction> = {
  right: 'row',
  left: 'row-reverse',
  down: 'column',
  up: 'column-reverse',
};

export function axes(direction: Direction): { main: Arrow; cross: Arrow } {
  switch (direction) {
    case 'row':
      return { main: 'right', cross: 'down' };
    case 'row-reverse':
      return { main: 'left', cross: 'down' };
    case 'column':
      return { main: 'down', cross: 'right' };
    case 'column-reverse':
      return { main: 'up', cross: 'right' };
  }
}

const WORDS: Record<Arrow, string> = {
  right: 'left to right',
  left: 'right to left',
  down: 'top to bottom',
  up: 'bottom to top',
};

export const SYMBOL: Record<Arrow, string> = { right: '→', left: '←', down: '↓', up: '↑' };

export function describeAxes(direction: Direction): string {
  const { main, cross } = axes(direction);
  return `Main axis runs ${WORDS[main]}: items line up along it, and justify-content moves them along it. Cross axis runs ${WORDS[cross]}: align-items moves them across it.`;
}
