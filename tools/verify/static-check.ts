/**
 * Static checks for CSS and HTML snippets that print nothing. Chromium must accept every
 * declaration, selector and media query, and know every element. Browsers drop what they
 * don't understand without an error, so a typo would otherwise ship unnoticed.
 */

export const STATIC_OK = 'static check: ok';

/**
 * Runs in the page, so it is plain JavaScript in a string (a serialized TypeScript function would
 * carry the transpiler's helpers with it).
 */
const INSPECT = String.raw`
function inspectCss(css) {
  const problems = [];
  // Descriptor blocks (@font-face, @property...) hold descriptors, not properties; the CSSOM
  // walk below still checks that they parse.
  const text = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@(font-face|property|counter-style|page|font-feature-values)[^{]*\{[^}]*\}/g, '');

  for (const m of text.matchAll(/(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+?)\s*(?:;|(?=\}))/g)) {
    const name = m[1];
    const raw = m[2];
    if (name.startsWith('--')) continue;
    const value = raw.replace(/\s*!important$/, '');
    if (!CSS.supports(name, value)) problems.push('declaration not supported: ' + name + ': ' + raw);
  }

  const keyframe = /^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/;
  for (const m of text.matchAll(/(?:^|[{};])\s*([^{};@\s][^{};]*?)\s*\{/g)) {
    const selector = m[1].trim();
    if (!selector || keyframe.test(selector)) continue;
    // Nested rules: & is the parent, and a leading combinator is relative to it.
    const testable = selector
      .split(',')
      .map((part) => part.trim().replace(/&/g, '*').replace(/^([>+~])/, '* $1'))
      .join(', ');
    try {
      document.querySelector(testable);
    } catch {
      problems.push('invalid selector: ' + selector);
    }
  }

  const sheet = new CSSStyleSheet();
  try {
    sheet.replaceSync(css);
  } catch (error) {
    problems.push('stylesheet rejected: ' + String(error));
  }
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        // A known feature either matches or its negation does; an unknown or malformed one
        // evaluates to "unknown", so neither matches.
        const features = [...rule.media.mediaText.matchAll(/\(([^()]+)\)/g)].map((f) => f[1]);
        const bad = features.filter(
          (f) => !matchMedia('(' + f + ')').matches && !matchMedia('not (' + f + ')').matches,
        );
        if (rule.media.mediaText === 'not all' || bad.length)
          problems.push('invalid media query: ' + rule.conditionText);
      }
      if (rule instanceof CSSFontFaceRule && !rule.style.getPropertyValue('src'))
        problems.push('@font-face without a valid src');
      if (rule.cssRules) walk(rule.cssRules);
    }
  };
  walk(sheet.cssRules);
  return problems;
}

// Custom elements have a hyphen; anything else unknown is a typo.
function inspectHtml() {
  return [...document.querySelectorAll('*')]
    .filter((el) => el instanceof HTMLUnknownElement && !el.localName.includes('-'))
    .map((el) => 'unknown element: <' + el.localName + '>');
}
`;

const report = (problems: string) => `<script>
${INSPECT}
const problems = [${problems}];
console.log(problems.length ? problems.join('\\n') : ${JSON.stringify(STATIC_OK)});
</script>`;

/** A page that prints STATIC_OK when the snippet passes, or its problems. */
export function staticCheckPage(code: string, lang: 'css' | 'html'): string {
  if (lang === 'css') return report(`...inspectCss(${JSON.stringify(code)})`);
  // The snippet's own scripts don't run here; its claims are checked separately.
  const markup = code.replace(/<script[\s\S]*?<\/script>/gi, '');
  return `${markup}
${report(`...[...document.querySelectorAll('style')].flatMap((s) => inspectCss(s.textContent)), ...inspectHtml()`)}`;
}
