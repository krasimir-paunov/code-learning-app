import { describe, expect, it } from 'vitest';
import { guardLoops } from '../../src/engine/runners/loop-guard.ts';
import { runInNode } from './node-runner.ts';

const BINARY_SEARCH = `function binarySearch(xs, target) {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xs[mid] === target) return mid;
    if (xs[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

describe('guardLoops', () => {
  it('keeps the program equivalent (labels, nesting without braces, do-while, for-of)', async () => {
    const code = `
      let out = [];
      outer: for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { if (j === 1) continue outer; out.push(i + '' + j); }
      let n = 0; do n++; while (n < 5);
      for (const x of [1, 2]) out.push(x);
      for(;;)break;while(false);
      console.log(out.join(','), n);`;
    const run = await runInNode({ files: { 'main.js': code } });
    expect(run.status).toBe('ok');
    expect(run.stdout).toEqual([{ level: 'log', text: '00,10,20,1,2 5' }]);
  });

  it('preserves line numbers (no newlines inserted)', () => {
    const result = guardLoops('let a = 1;\nwhile (a < 3) a++;\nfor (;;) {}\n');
    expect(result.ok && result.code.split('\n')).toHaveLength(4);
  });

  it('stops an infinite loop with a message naming its line', async () => {
    const run = await runInNode({ files: { 'main.js': 'let x = 0;\nwhile (true) {\n  x++;\n}' } });
    expect(run.status).toBe('runtime-error');
    expect(run.diagnostics[0]?.message).toContain('The loop on line 2 ran for more than 2 s');
  }, 10_000);

  it('reports syntax errors with a position instead of running', async () => {
    const result = guardLoops('const a = ;');
    expect(result).toMatchObject({
      ok: false,
      diagnostic: { line: 1, column: 11, severity: 'error' },
    });
    const run = await runInNode({ files: { 'main.js': 'const a = ;' } });
    expect(run.status).toBe('compile-error');
  });
});

describe('test harness in node', () => {
  it('runs tests after the learner code in the same realm, including top-level const', async () => {
    const run = await runInNode({
      files: { 'main.js': `${BINARY_SEARCH}\nconst primes = [2, 3, 5];` },
      tests: `
        test('finds 3', () => expect(binarySearch(primes, 3)).toBe(1));
        test('deep equality', () => expect({ a: [1, { b: 2 }] }).toEqual({ a: [1, { b: 2 }] }));
        test('fails clearly', () => expect(binarySearch([1, 2], 2)).toBe(0));
        test('throws', () => expect(() => { throw new RangeError('nope'); }).toThrow('nope'));
        test('not', () => expect(1).not.toBe(2));
        test('async', async () => { await null; expect(0.1 + 0.2).toBeCloseTo(0.3, 5); });`,
    });
    expect(run.status).toBe('ok');
    expect(run.tests).toEqual([
      { name: 'finds 3', passed: true },
      { name: 'deep equality', passed: true },
      { name: 'fails clearly', passed: false, message: 'Expected 0, received 1' },
      { name: 'throws', passed: true },
      { name: 'not', passed: true },
      { name: 'async', passed: true },
    ]);
  });

  it('reports runtime errors in the learner code', async () => {
    const run = await runInNode({ files: { 'main.js': 'undefinedFunction();' } });
    expect(run.status).toBe('runtime-error');
    expect(run.diagnostics[0]?.message).toContain('ReferenceError');
  });

  it('captures console output with formatted values', async () => {
    const run = await runInNode({
      files: { 'main.js': "console.log('a', [1, 'b'], { x: null });" },
    });
    expect(run.stdout[0]?.text).toBe('a [1, "b"] { x: null }');
  });
});
