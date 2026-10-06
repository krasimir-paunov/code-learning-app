import type { Diagnostic } from '../loop-guard.ts';
import { guardLoops } from '../loop-guard.ts';
import type { RunRequest } from '../contract.ts';

/**
 * Runs first inside the sandbox document: forwards console output and uncaught errors to the
 * parent through the MessageChannel port that sandbox.html received.
 */
const BOOTSTRAP = `(function () {
  var port = window.__port;
  function send(message) { try { port.postMessage(message); } catch (e) {} }
  function text(args) {
    return Array.prototype.map.call(args, function (a) {
      return typeof a === 'string' ? a : window.__harness.format(a);
    }).join(' ');
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      send({ type: 'console', level: level, text: text(arguments) });
      original.apply(console, arguments);
    };
  });
  function describe(error, fallback) {
    if (error && error.name) return { message: error.name + ': ' + error.message, stack: String(error.stack || '') };
    return { message: String(fallback), stack: '' };
  }
  window.addEventListener('error', function (event) {
    var info = describe(event.error, event.message);
    send({ type: 'error', message: info.message, stack: info.stack, line: event.lineno, column: event.colno });
  });
  window.addEventListener('unhandledrejection', function (event) {
    var info = describe(event.reason, 'Unhandled promise rejection: ' + event.reason);
    send({ type: 'error', message: info.message, stack: info.stack });
  });
  window.__send = send;
})();`;

const FINISH = `(async function () {
  await new Promise(function (resolve) { setTimeout(resolve, 0); });
  var config = JSON.parse(document.getElementById('__config').textContent);
  var tests = config.tests ? await window.__harness.run() : [];
  var measurements = config.measure
    ? window.__harness.measure(config.measure.selectors, config.measure.properties)
    : undefined;
  window.__send({ type: 'done', tests: tests, measurements: measurements });
})();`;

/** Inline script text must not close its own <script> element. */
function scriptSafe(code: string): string {
  return code.replace(/<\/(script)/gi, '<\\/$1');
}

function script(code: string, sourceUrl?: string): string {
  const named = sourceUrl ? `${code}\n//# sourceURL=${sourceUrl}` : code;
  return `<script>${scriptSafe(named)}</script>`;
}

function insertBefore(
  html: string,
  pattern: RegExp,
  text: string,
  fallback: 'start' | 'end',
): string {
  const match = pattern.exec(html);
  if (match) return html.slice(0, match.index) + text + html.slice(match.index);
  return fallback === 'start' ? text + html : html + text;
}

export type BuildResult = { ok: true; html: string } | { ok: false; diagnostics: Diagnostic[] };

/**
 * Builds the complete document written into the sandbox: harness + bootstrap first, the
 * learner's CSS in <head>, the learner's HTML, each JS file as its own guarded classic script
 * (shared global scope, `//# sourceURL` so errors name the file), then tests and the finisher.
 * `<link href="style.css">` and `<script src="main.js">` in the learner's HTML are inlined.
 */
export function buildSandboxDocument(request: RunRequest, harness: string): BuildResult {
  const entries = Object.entries(request.files);
  let html = entries.find(([name]) => name.endsWith('.html'))?.[1] ?? '';
  const css = entries.filter(([name]) => name.endsWith('.css'));
  const js = entries.filter(([name]) => name.endsWith('.js'));

  const diagnostics: Diagnostic[] = [];
  const guarded = new Map<string, string>();
  for (const [name, source] of js) {
    const result = guardLoops(source);
    if (result.ok) guarded.set(name, result.code);
    else
      diagnostics.push({ ...result.diagnostic, message: `${name}: ${result.diagnostic.message}` });
  }
  if (request.tests !== undefined) {
    const result = guardLoops(request.tests);
    if (!result.ok)
      diagnostics.push({ ...result.diagnostic, message: `tests: ${result.diagnostic.message}` });
  }
  if (diagnostics.length) return { ok: false, diagnostics };

  // Inline scripts written directly in the HTML get the same loop guard.
  html = html.replace(
    /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi,
    (whole, attrs = '', body: string) => {
      if (/\bsrc\s*=/i.test(attrs) || !body.trim()) return whole;
      const result = guardLoops(body);
      return result.ok ? `<script${attrs}>${result.code}</script>` : whole;
    },
  );

  for (const [name, source] of css) {
    const tag = `<style data-file="${name}">${source.replace(/<\/style/gi, '<\\/style')}</style>`;
    const link = new RegExp(`<link[^>]*href=["']\\.?/?${name.replace('.', '\\.')}["'][^>]*>`, 'i');
    html = link.test(html)
      ? html.replace(link, tag)
      : insertBefore(html, /<\/head>/i, tag, 'start');
  }
  for (const [name, code] of guarded) {
    const tag = script(code, name);
    const ref = new RegExp(
      `<script[^>]*src=["']\\.?/?${name.replace('.', '\\.')}["'][^>]*>\\s*</script>`,
      'i',
    );
    html = ref.test(html) ? html.replace(ref, tag) : insertBefore(html, /<\/body>/i, tag, 'end');
  }

  const config = JSON.stringify({
    tests: request.tests !== undefined,
    measure: request.measure,
  }).replace(/</g, '\\u003c');
  const tail =
    (request.tests !== undefined ? script(request.tests, 'tests.js') : '') +
    `<script type="application/json" id="__config">${config}</script>` +
    script(FINISH);
  html = insertBefore(html, /<\/body>/i, tail, 'end');

  const head = `<meta charset="utf-8">${script(harness)}${script(BOOTSTRAP)}`;
  html = /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (tag) => tag + head)
    : head + html;
  if (!/^\s*<!doctype/i.test(html)) html = `<!doctype html>${html}`;
  return { ok: true, html };
}

/** Maps a stack trace to a learner file and line using the sourceURL names. */
export function locateError(
  stack: string,
  files: readonly string[],
): { file: string; line: number; column: number } | undefined {
  for (const file of [...files, 'tests.js']) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`${escaped}:(\\d+):(\\d+)`).exec(stack);
    if (match) return { file, line: Number(match[1]), column: Number(match[2]) };
  }
  return undefined;
}
