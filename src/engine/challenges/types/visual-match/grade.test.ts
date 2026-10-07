import { describe, expect, it } from 'vitest';
import type { Measurement } from '../../../runners/contract.ts';
import { combineViewports, compareLayouts } from './index.ts';

const box = (width: number, height: number, x = 8, y = 8): Measurement => ({
  found: true,
  box: { x, y, width, height },
  styles: { 'box-sizing': 'border-box' },
});

const compare = { selectors: ['.card', '.title'], tolerancePx: 2, properties: [] as string[] };

describe('visual-match comparison', () => {
  it('passes when every box is within tolerance', () => {
    const target = { '.card': box(250, 100), '.title': box(200, 20) };
    const learner = { '.card': box(251.5, 99), '.title': box(200, 21) };
    expect(compareLayouts(target, learner, compare).passed).toBe(true);
  });

  it('reports the first difference precisely', () => {
    const target = { '.card': box(250, 100), '.title': box(200, 20) };
    const learner = { '.card': box(300, 100, 18), '.title': box(200, 20) };
    const result = compareLayouts(target, learner, compare);
    expect(result.passed).toBe(false);
    expect(result.feedback).toBe(
      '1 of 2 elements match. `.card`: width is 300px, target 250px; left edge is 18px, target 8px.',
    );
  });

  it('compares listed computed styles exactly', () => {
    const target = { '.card': box(250, 100) };
    const learner = { '.card': { ...box(250, 100), styles: { 'box-sizing': 'content-box' } } };
    const result = compareLayouts(target, learner, {
      ...compare,
      selectors: ['.card'],
      properties: ['box-sizing'],
    });
    expect(result.details?.[0]?.message).toBe('box-sizing is content-box, target border-box');
  });

  it('flags elements the learner removed', () => {
    const result = compareLayouts(
      { '.card': box(1, 1) },
      { '.card': { found: false } },
      { ...compare, selectors: ['.card'] },
    );
    expect(result.details?.[0]).toEqual({ label: '.card', passed: false, message: 'is missing' });
  });
});

describe('visual-match at several widths', () => {
  const pass = {
    passed: true,
    feedback: 'Matches the target.',
    details: [{ label: '.card', passed: true }],
  };
  const fail = {
    passed: false,
    feedback: '0 of 1 elements match. `.card`: width is 300px, target 250px.',
    details: [{ label: '.card', passed: false, message: 'width is 300px, target 250px' }],
  };

  it('returns a single result unchanged', () => {
    expect(combineViewports([{ viewport: { width: 320, height: 240 }, result: fail }])).toBe(fail);
  });

  it('labels details by width and names the first failing width', () => {
    const result = combineViewports([
      { viewport: { width: 360, height: 600 }, result: pass },
      { viewport: { width: 960, height: 600 }, result: fail },
    ]);
    expect(result.passed).toBe(false);
    expect(result.feedback).toBe(
      'Matches at 1 of 2 widths. At 960px: 0 of 1 elements match. `.card`: width is 300px, target 250px.',
    );
    expect(result.details?.map((d) => d.label)).toEqual(['360px · .card', '960px · .card']);
  });

  it('passes only when every width matches', () => {
    const viewports = [360, 640, 960].map((width) => ({
      viewport: { width, height: 600 },
      result: pass,
    }));
    expect(combineViewports(viewports).passed).toBe(true);
  });
});
