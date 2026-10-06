import { describe, expect, it } from 'vitest';
import { buildSandboxDocument, locateError } from './document.ts';

const HARNESS = '/*harness*/';

function build(files: Record<string, string>, extra = {}) {
  const result = buildSandboxDocument({ files, ...extra }, HARNESS);
  if (!result.ok) throw new Error(result.diagnostics.map((d) => d.message).join());
  return result.html;
}

describe('buildSandboxDocument', () => {
  it('puts the harness and bootstrap first, then CSS, HTML, JS, tests and the finisher', () => {
    const html = build(
      { 'index.html': '<p>hi</p>', 'style.css': 'p{color:red}', 'main.js': 'let a = 1;' },
      { tests: "test('t', () => {});" },
    );
    const order = [
      '/*harness*/',
      'console[level]',
      'p{color:red}',
      '<p>hi</p>',
      'let a = 1;',
      "test('t'",
      '__config',
    ];
    const positions = order.map((s) => html.indexOf(s));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('//# sourceURL=main.js');
  });

  it('inlines files referenced by <link> and <script src> where they are written', () => {
    const html = build({
      'index.html':
        '<html><head><link rel="stylesheet" href="./style.css"></head><body><script src="main.js"></script><p>after</p></body></html>',
      'style.css': 'body{margin:0}',
      'main.js': 'console.log(1);',
    });
    expect(html).not.toContain('href="./style.css"');
    expect(html).not.toContain('src="main.js"');
    expect(html.indexOf('console.log(1);')).toBeLessThan(html.indexOf('<p>after</p>'));
  });

  it('guards loops in JS files and in inline scripts written in the HTML', () => {
    const html = build({
      'index.html': '<script>while (true) {}</script>',
      'main.js': 'for (;;) {}',
    });
    expect(html.match(/__lgTick/g)).toHaveLength(2);
  });

  it('cannot be broken out of with </script> inside learner code', () => {
    const html = build({ 'main.js': "const s = '</script><script>alert(1)</script>';" });
    expect(html).not.toContain("'</script>");
  });

  it('reports syntax errors per file without building', () => {
    const result = buildSandboxDocument({ files: { 'main.js': 'let = ;' } }, HARNESS);
    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ line: 1, severity: 'error' }],
    });
  });
});

describe('locateError', () => {
  it('finds the learner file and line from a stack trace', () => {
    const stack = 'ReferenceError: nope is not defined\n    at main.js:2:1';
    expect(locateError(stack, ['main.js'])).toEqual({ file: 'main.js', line: 2, column: 1 });
    expect(locateError('at somewhere:1:1', ['main.js'])).toBeUndefined();
  });
});
