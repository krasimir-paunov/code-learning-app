import { describe, expect, it } from 'vitest';
import { cssFor, layoutBox, type BoxInput } from './model.ts';

const base: BoxInput = {
  width: 200,
  padding: 20,
  border: 5,
  margin: 10,
  boxSizing: 'content-box',
  contentHeight: 24,
};

describe('layoutBox', () => {
  it('adds padding and border to width in content-box (the default)', () => {
    const box = layoutBox(base);
    expect(box.content.width).toBe(200);
    expect(box.borderBox).toEqual({ width: 250, height: 74 });
    expect(box.marginBox).toEqual({ width: 270, height: 94 });
    expect(box.explanation).toBe(
      'Visible width = 200 (width) + 2 × 20 (padding) + 2 × 5 (border) = 250px.',
    );
  });

  it('keeps the visible width equal to width in border-box', () => {
    const box = layoutBox({ ...base, boxSizing: 'border-box' });
    expect(box.borderBox.width).toBe(200);
    expect(box.content.width).toBe(150);
  });

  it('never lets border-box content go negative', () => {
    expect(layoutBox({ ...base, width: 20, boxSizing: 'border-box' }).content.width).toBe(0);
  });

  it('writes the matching CSS rule', () => {
    expect(cssFor(base)).toBe(
      '.box {\n  width: 200px;\n  padding: 20px;\n  border: 5px solid;\n  margin: 10px;\n}',
    );
    expect(cssFor({ ...base, boxSizing: 'border-box' })).toContain('box-sizing: border-box;');
  });
});
