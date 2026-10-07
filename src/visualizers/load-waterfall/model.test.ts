import { describe, expect, it } from 'vitest';
import { simulate, type Resource } from './model.ts';

const css: Resource = { id: 'style.css', kind: 'css', download: 100 };
const app = (kind: Resource['kind'], download = 200): Resource => ({
  id: 'app.js',
  kind,
  download,
  run: 30,
});

describe('simulate', () => {
  it('stops the parser for a classic script until it has downloaded and run', () => {
    const t = simulate([app('script')]);
    expect(t.blocked).toEqual([[2, 200]]);
    expect(t.resources[0]?.ran).toEqual([200, 230]);
    expect(t.parseEnd).toBe(290);
  });

  it('makes a classic script wait for the stylesheet above it', () => {
    const t = simulate([{ ...css, download: 300 }, app('script', 50)]);
    expect(t.resources[1]?.ran?.[0]).toBe(300);
  });

  it('runs defer scripts after parsing, before DOMContentLoaded', () => {
    const t = simulate([app('defer')]);
    expect(t.blocked).toEqual([]);
    expect(t.parseEnd).toBe(62);
    expect(t.resources[0]?.ran).toEqual([200, 230]);
    expect(t.domContentLoaded).toBe(230);
  });

  it('treats module scripts like defer', () => {
    expect(simulate([app('module')]).resources[0]?.ran).toEqual(
      simulate([app('defer')]).resources[0]?.ran,
    );
  });

  it('keeps document order for deferred scripts, whatever finishes first', () => {
    const t = simulate([
      { id: 'a.js', kind: 'defer', download: 300, run: 10 },
      { id: 'b.js', kind: 'defer', download: 50, run: 10 },
    ]);
    expect(t.order).toEqual(['a.js', 'b.js']);
  });

  it('runs async scripts in the order they arrive', () => {
    const t = simulate([
      { id: 'a.js', kind: 'async', download: 300, run: 10 },
      { id: 'b.js', kind: 'async', download: 50, run: 10 },
    ]);
    expect(t.order).toEqual(['b.js', 'a.js']);
  });

  it('waits for stylesheets before the first paint', () => {
    expect(simulate([css]).firstPaint).toBe(100);
  });
});
