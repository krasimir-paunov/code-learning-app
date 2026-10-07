/**
 * What assistive technology gets from HTML: each element's role, accessible name and states,
 * following HTML-AAM and a simplified accname algorithm. Works on any DOM (an inert DOMParser
 * document in the app, jsdom in tests). It reads no computed CSS, so only `hidden` and
 * `aria-hidden` hide content; lesson pages avoid CSS-only hiding.
 */

export const LANDMARK_ROLES = new Set([
  'banner',
  'complementary',
  'contentinfo',
  'form',
  'main',
  'navigation',
  'region',
  'search',
]);

/** Roles whose accessible name comes from their content when nothing else names them. */
const NAME_FROM_CONTENT = new Set([
  'button',
  'cell',
  'checkbox',
  'columnheader',
  'gridcell',
  'heading',
  'link',
  'menuitem',
  'option',
  'radio',
  'row',
  'rowheader',
  'switch',
  'tab',
  'term',
  'tooltip',
  'treeitem',
]);

const SECTIONING = 'article, aside, main, nav, section';

const INPUT_ROLES: Record<string, string> = {
  button: 'button',
  checkbox: 'checkbox',
  email: 'textbox',
  image: 'button',
  number: 'spinbutton',
  password: 'textbox',
  radio: 'radio',
  range: 'slider',
  reset: 'button',
  search: 'searchbox',
  submit: 'button',
  tel: 'textbox',
  text: 'textbox',
  url: 'textbox',
};

const SIMPLE_ROLES: Record<string, string> = {
  article: 'article',
  aside: 'complementary',
  blockquote: 'blockquote',
  button: 'button',
  caption: 'caption',
  code: 'code',
  dd: 'definition',
  del: 'deletion',
  details: 'group',
  dfn: 'term',
  dialog: 'dialog',
  dt: 'term',
  em: 'emphasis',
  fieldset: 'group',
  figure: 'figure',
  hr: 'separator',
  ins: 'insertion',
  li: 'listitem',
  main: 'main',
  mark: 'mark',
  menu: 'list',
  meter: 'meter',
  nav: 'navigation',
  ol: 'list',
  optgroup: 'group',
  option: 'option',
  output: 'status',
  p: 'paragraph',
  progress: 'progressbar',
  search: 'search',
  strong: 'strong',
  sub: 'subscript',
  sup: 'superscript',
  table: 'table',
  tbody: 'rowgroup',
  td: 'cell',
  textarea: 'textbox',
  tfoot: 'rowgroup',
  thead: 'rowgroup',
  time: 'time',
  tr: 'row',
  ul: 'list',
};

/** The role an element has without a `role` attribute (`generic` when it has no meaning). */
export function implicitRole(element: Element): string {
  const tag = element.localName;
  const simple = SIMPLE_ROLES[tag];
  if (simple) return simple;
  if (/^h[1-6]$/.test(tag)) return 'heading';
  switch (tag) {
    case 'a':
    case 'area':
      return element.hasAttribute('href') ? 'link' : 'generic';
    case 'img':
      return element.getAttribute('alt') === '' ? 'presentation' : 'img';
    case 'input': {
      const type = (element.getAttribute('type') ?? 'text').toLowerCase();
      if (type === 'hidden') return 'none';
      if (element.hasAttribute('list') && INPUT_ROLES[type] === 'textbox') return 'combobox';
      return INPUT_ROLES[type] ?? 'textbox';
    }
    case 'select': {
      const size = Number(element.getAttribute('size') ?? '0');
      return element.hasAttribute('multiple') || size > 1 ? 'listbox' : 'combobox';
    }
    case 'header':
      return element.parentElement?.closest(SECTIONING) ? 'generic' : 'banner';
    case 'footer':
      return element.parentElement?.closest(SECTIONING) ? 'generic' : 'contentinfo';
    case 'section':
      return hasAuthorName(element) ? 'region' : 'generic';
    case 'form':
      return hasAuthorName(element) ? 'form' : 'generic';
    case 'th': {
      const scope = element.getAttribute('scope');
      if (scope === 'row' || scope === 'rowgroup') return 'rowheader';
      return 'columnheader';
    }
    default:
      return 'generic';
  }
}

export function role(element: Element): string {
  const explicit = element.getAttribute('role')?.trim().split(/\s+/)[0];
  return explicit || implicitRole(element);
}

function hasAuthorName(element: Element): boolean {
  return Boolean(
    element.getAttribute('aria-label')?.trim() || element.getAttribute('aria-labelledby')?.trim(),
  );
}

export function isHidden(element: Element): boolean {
  return Boolean(element.closest('[hidden], [aria-hidden="true"]'));
}

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Text a node contributes to a name computed from content (alt text included). */
function textOf(node: Node): string {
  if (node.nodeType === 3) return node.textContent ?? '';
  if (node.nodeType !== 1) return '';
  const element = node as Element;
  if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') return '';
  const label = element.getAttribute('aria-label')?.trim();
  if (label) return ` ${label} `;
  if (element.localName === 'img') return ` ${element.getAttribute('alt') ?? ''} `;
  if (element.localName === 'input' || element.localName === 'select') return '';
  const inner = Array.from(element.childNodes, textOf).join('');
  // Block-level children are separate words even without spaces in the markup.
  return /^(p|div|li|h[1-6]|br|td|th|tr)$/.test(element.localName) ? ` ${inner} ` : inner;
}

/** The tree an id refers to: the document, or the shadow root the element lives in. */
function scopeOf(element: Element): Document | ShadowRoot {
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root : element.ownerDocument;
}

function labelFor(element: Element): string {
  const parts: string[] = [];
  const id = element.getAttribute('id');
  if (id) {
    for (const label of scopeOf(element).querySelectorAll('label')) {
      if (label.getAttribute('for') === id) parts.push(textOf(label));
    }
  }
  const wrapping = element.closest('label');
  if (wrapping && !wrapping.hasAttribute('for')) parts.push(textOf(wrapping));
  return squash(parts.join(' '));
}

/** The accessible name: what a screen reader announces as the element's label. */
export function accessibleName(element: Element): string {
  const labelledBy = element.getAttribute('aria-labelledby')?.trim();
  if (labelledBy) {
    const scope = scopeOf(element);
    const text = labelledBy
      .split(/\s+/)
      .map((id) => scope.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      .map((el) => textOf(el))
      .join(' ');
    if (squash(text)) return squash(text);
  }
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) return squash(ariaLabel);

  const tag = element.localName;
  const type = (element.getAttribute('type') ?? '').toLowerCase();
  if (tag === 'input' && (type === 'submit' || type === 'reset' || type === 'button')) {
    const value = element.getAttribute('value');
    if (value !== null) return squash(value);
    if (type === 'submit') return 'Submit';
    if (type === 'reset') return 'Reset';
  }
  if (tag === 'input' && type === 'image') return squash(element.getAttribute('alt') ?? '');
  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    const label = labelFor(element);
    if (label) return label;
  }
  if (tag === 'img' || tag === 'area') {
    const alt = element.getAttribute('alt');
    if (alt !== null) return squash(alt);
  }
  const caption =
    tag === 'fieldset'
      ? element.querySelector(':scope > legend')
      : tag === 'table'
        ? element.querySelector(':scope > caption')
        : tag === 'figure'
          ? element.querySelector(':scope > figcaption')
          : null;
  if (caption) return squash(textOf(caption));
  if (NAME_FROM_CONTENT.has(role(element))) {
    const text = squash(Array.from(element.childNodes, textOf).join(''));
    if (text) return text;
  }
  const title = squash(element.getAttribute('title') ?? '');
  if (title) return title;
  // Last resort for text fields, after title (as Chromium does): the placeholder.
  return tag === 'input' || tag === 'textarea'
    ? squash(element.getAttribute('placeholder') ?? '')
    : '';
}

/** The accessible description: what aria-describedby points at, read after the name. */
export function accessibleDescription(element: Element): string {
  const ids = element.getAttribute('aria-describedby')?.trim();
  if (!ids) return '';
  const scope = scopeOf(element);
  return squash(
    ids
      .split(/\s+/)
      .map((id) => scope.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      .map((el) => textOf(el))
      .join(' '),
  );
}

export function headingLevel(element: Element): number | undefined {
  const aria = Number(element.getAttribute('aria-level'));
  if (aria >= 1) return aria;
  const match = /^h([1-6])$/.exec(element.localName);
  return match ? Number(match[1]) : undefined;
}

/** State words a screen reader adds after the name (checked, expanded, required...). */
export function states(element: Element): string[] {
  const out: string[] = [];
  const r = role(element);
  const aria = (name: string) => element.getAttribute(`aria-${name}`);
  if (r === 'checkbox' || r === 'radio' || r === 'switch') {
    const checked = aria('checked') ?? (element.hasAttribute('checked') ? 'true' : 'false');
    out.push(checked === 'true' ? 'checked' : checked === 'mixed' ? 'mixed' : 'not checked');
  }
  if (aria('expanded') === 'true') out.push('expanded');
  if (aria('expanded') === 'false') out.push('collapsed');
  if (aria('pressed') === 'true') out.push('pressed');
  if (aria('current') && aria('current') !== 'false') out.push('current');
  if (element.hasAttribute('required') || aria('required') === 'true') out.push('required');
  if (aria('invalid') && aria('invalid') !== 'false') out.push('invalid entry');
  if (element.hasAttribute('disabled') || aria('disabled') === 'true') out.push('unavailable');
  if (aria('invalid') === 'true') out.push('invalid');
  return out;
}

export interface AxNode {
  role: string;
  name: string;
  level?: number;
  states: string[];
  children: AxNode[];
  /** Text content shown as static text (role "text"). */
  text?: string;
  element?: Element;
}

const IGNORED = new Set(['generic', 'none', 'presentation']);

/**
 * The accessibility tree under `root`: meaningful elements become nodes, generic ones
 * (div, span, unnamed section...) are skipped and their children hoisted, hidden content is
 * dropped, and text becomes "text" leaves.
 */
export function axTree(root: Element): AxNode[] {
  const visit = (node: Node): AxNode[] => {
    if (node.nodeType === 3) {
      const text = squash(node.textContent ?? '');
      return text ? [{ role: 'text', name: text, states: [], children: [], text }] : [];
    }
    if (node.nodeType !== 1) return [];
    const element = node as Element;
    if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') return [];
    if (/^(script|style|template|head|title|meta|link)$/.test(element.localName)) return [];
    const children = Array.from(element.childNodes).flatMap(visit);
    const r = role(element);
    if (IGNORED.has(r)) return children;
    return [
      {
        role: r,
        name: accessibleName(element),
        level: r === 'heading' ? headingLevel(element) : undefined,
        states: states(element),
        children,
        element,
      },
    ];
  };
  return Array.from(root.childNodes).flatMap(visit);
}

export function flatten(nodes: readonly AxNode[]): AxNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

export interface HeadingIssue {
  kind: 'no-h1' | 'multiple-h1' | 'skipped' | 'empty';
  message: string;
}

/** Headings in order with their problems: what a screen reader's headings list shows. */
export function headingOutline(root: Element): {
  headings: { level: number; name: string; issues: HeadingIssue[] }[];
  issues: HeadingIssue[];
} {
  const found = flatten(axTree(root)).filter((n) => n.role === 'heading');
  let previous = 0;
  const headings = found.map((n) => {
    const level = n.level ?? 2;
    const issues: HeadingIssue[] = [];
    if (previous && level > previous + 1) {
      issues.push({
        kind: 'skipped',
        message: `Jumps from level ${previous} to ${level}: level ${previous + 1} is missing.`,
      });
    }
    if (!n.name) issues.push({ kind: 'empty', message: 'Empty heading: nothing to announce.' });
    previous = level;
    return { level, name: n.name, issues };
  });
  const issues: HeadingIssue[] = [];
  const h1s = headings.filter((h) => h.level === 1).length;
  if (h1s === 0)
    issues.push({
      kind: 'no-h1',
      message: 'No level 1 heading: the page has no title in the outline.',
    });
  if (h1s > 1)
    issues.push({
      kind: 'multiple-h1',
      message: `${h1s} level 1 headings: one per page is the convention.`,
    });
  return { headings, issues };
}

/** Landmarks in order, as a screen reader's landmarks list shows them. */
export function landmarks(root: Element): { role: string; name: string }[] {
  return flatten(axTree(root))
    .filter((n) => LANDMARK_ROLES.has(n.role))
    .map((n) => ({ role: n.role, name: n.name }));
}

/** How a screen reader typically announces a node: name, role, then states. */
export function announce(node: AxNode): string {
  if (node.role === 'text') return node.name;
  const roleWord =
    node.role === 'heading' && node.level
      ? `heading level ${node.level}`
      : (ROLE_WORDS[node.role] ?? node.role);
  return [node.name, roleWord, ...node.states].filter(Boolean).join(', ');
}

const ROLE_WORDS: Record<string, string> = {
  banner: 'banner landmark',
  complementary: 'complementary landmark',
  contentinfo: 'content information landmark',
  main: 'main landmark',
  navigation: 'navigation landmark',
  region: 'region landmark',
  search: 'search landmark',
  form: 'form landmark',
  img: 'image',
  textbox: 'edit text',
  columnheader: 'column header',
  rowheader: 'row header',
  listitem: 'list item',
};
