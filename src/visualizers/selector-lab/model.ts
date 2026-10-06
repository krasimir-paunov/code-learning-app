/**
 * Selectors read aloud: a small parser for the selector features the lessons teach, turning
 * `article > p.intro` into "every p with class intro that is a direct child of an article".
 * Matching itself is always left to the browser (querySelectorAll).
 */

import { splitSelectorList } from '../shared/css/specificity.ts';

type Combinator = ' ' | '>' | '+' | '~';

interface Compound {
  type?: string;
  universal: boolean;
  ids: string[];
  classes: string[];
  attributes: { name: string; op?: string; value?: string }[];
  pseudoClasses: string[];
  pseudoElement?: string;
}

/** Tag names spelled out letter by letter when read aloud ("an h2", "a ul"). */
const SPELLED = /^(h[1-6]|li|ul|ol|dl|dt|dd|td|th|tr|hr|br|p|a|b|i|em|nav)$/;

function article(phrase: string): string {
  const first = phrase.split(' ')[0] ?? phrase;
  const vowelSound = SPELLED.test(first) ? /^[aefhilmnorsx]/.test(first) : /^[aeiou]/i.test(first);
  return `${vowelSound ? 'an' : 'a'} ${phrase}`;
}

function parseCompound(text: string): Compound | null {
  const compound: Compound = {
    universal: false,
    ids: [],
    classes: [],
    attributes: [],
    pseudoClasses: [],
  };
  const TOKEN =
    /^(\*)|^([a-zA-Z][\w-]*)|^#([\w-]+)|^\.([\w-]+)|^\[\s*([\w-]+)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\s*)?\]|^::([\w-]+)|^:([\w-]+(?:\([^)]*\))?)/;
  let rest = text;
  while (rest) {
    const m = TOKEN.exec(rest);
    if (!m) return null;
    if (m[1]) compound.universal = true;
    else if (m[2]) compound.type = m[2].toLowerCase();
    else if (m[3]) compound.ids.push(m[3]);
    else if (m[4]) compound.classes.push(m[4]);
    else if (m[5]) compound.attributes.push({ name: m[5], op: m[6], value: m[7] ?? m[8] ?? m[9] });
    else if (m[10]) compound.pseudoElement = m[10];
    else if (m[11]) compound.pseudoClasses.push(m[11]);
    rest = rest.slice(m[0].length);
  }
  return compound;
}

const OPS: Record<string, string> = {
  '=': 'is exactly',
  '^=': 'starts with',
  '$=': 'ends with',
  '*=': 'contains',
  '~=': 'includes the word',
  '|=': 'is or starts with',
};

function describeCompound(c: Compound): string {
  const noun = c.type ?? 'element';
  const parts: string[] = [];
  if (c.ids.length) parts.push(`with id ${c.ids.join(' and ')}`);
  if (c.classes.length) parts.push(`with class ${c.classes.join(' and ')}`);
  for (const a of c.attributes) {
    parts.push(
      a.op
        ? `whose ${a.name} ${OPS[a.op] ?? a.op} "${a.value ?? ''}"`
        : `that has a ${a.name} attribute`,
    );
  }
  for (const p of c.pseudoClasses) parts.push(`that is :${p}`);
  const base = [noun, ...parts].join(' ');
  return c.pseudoElement ? `the ::${c.pseudoElement} of every ${base}` : base;
}

/** Splits a complex selector into compounds and the combinators between them. */
function tokenizeComplex(
  selector: string,
): { compounds: string[]; combinators: Combinator[] } | null {
  const compounds: string[] = [];
  const combinators: Combinator[] = [];
  let current = '';
  let depth = 0;
  let pending: Combinator | null = null;
  const flush = () => {
    if (!current) return;
    if (compounds.length) combinators.push(pending ?? ' ');
    compounds.push(current);
    current = '';
    pending = null;
  };
  for (const ch of selector.trim()) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (depth === 0 && (ch === '>' || ch === '+' || ch === '~')) {
      flush();
      pending = ch;
    } else if (depth === 0 && /\s/.test(ch)) {
      flush();
    } else {
      current += ch;
    }
  }
  flush();
  if (pending || !compounds.length || combinators.length !== compounds.length - 1) return null;
  return { compounds, combinators };
}

const LINK: Record<Combinator, string> = {
  ' ': 'inside',
  '>': 'that is a direct child of',
  '+': 'that comes right after',
  '~': 'that comes somewhere after',
};

/** "Every p with class intro that is a direct child of an article", or null if unsupported. */
export function describeSelector(selector: string): string | null {
  const list = splitSelectorList(selector);
  if (!list.length) return null;
  const sentences: string[] = [];
  for (const complex of list) {
    const tokens = tokenizeComplex(complex);
    if (!tokens) return null;
    const compounds = tokens.compounds.map(parseCompound);
    if (compounds.some((c) => c === null)) return null;
    const parsed = compounds as Compound[];
    const subject = parsed.at(-1) as Compound;
    let sentence = subject.pseudoElement
      ? describeCompound(subject)
      : `every ${describeCompound(subject)}`;
    for (let i = parsed.length - 2; i >= 0; i--) {
      const combinator = tokens.combinators[i] as Combinator;
      const sibling = combinator === '+' || combinator === '~';
      sentence += ` ${LINK[combinator]} ${article(describeCompound(parsed[i] as Compound))}`;
      if (sibling) sentence += ' (same parent)';
    }
    sentences.push(sentence);
  }
  const text = sentences.join(', and also ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}
