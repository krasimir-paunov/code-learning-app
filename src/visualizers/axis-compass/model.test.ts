import { describe, expect, it } from 'vitest';
import { axes, DIRECTION_FOR, describeAxes } from './model.ts';

describe('axes', () => {
  it('runs the main axis along flex-direction', () => {
    expect(axes('row')).toEqual({ main: 'right', cross: 'down' });
    expect(axes('column')).toEqual({ main: 'down', cross: 'right' });
    expect(axes('row-reverse').main).toBe('left');
    expect(axes('column-reverse').main).toBe('up');
  });

  it('round-trips with the compass', () => {
    for (const [arrow, direction] of Object.entries(DIRECTION_FOR)) {
      expect(axes(direction).main).toBe(arrow);
    }
  });
});

describe('describeAxes', () => {
  it('names the axis each property follows', () => {
    expect(describeAxes('column')).toMatch(
      /^Main axis runs top to bottom.*Cross axis runs left to right/,
    );
  });
});
