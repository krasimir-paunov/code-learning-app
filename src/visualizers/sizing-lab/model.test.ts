import { describe, expect, it } from 'vitest';
import { columns } from './model.ts';

const base = { container: 400, percent: 50, padding: 20, border: 2 } as const;

describe('columns', () => {
  it('content-box adds padding and border on top of the 50%', () => {
    expect(columns({ ...base, sizing: 'content-box' })).toEqual({
      width: 200,
      visible: 244,
      content: 200,
      total: 488,
      fits: false,
    });
  });

  it('border-box keeps the visible width at 50% and shrinks the content', () => {
    expect(columns({ ...base, sizing: 'border-box' })).toEqual({
      width: 200,
      visible: 200,
      content: 156,
      total: 400,
      fits: true,
    });
  });

  it('border-box cannot shrink below its padding and border', () => {
    expect(columns({ ...base, padding: 120, sizing: 'border-box' }).visible).toBe(244);
  });
});
