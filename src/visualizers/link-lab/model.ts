/**
 * What clicking a link does, decided by the browser's own URL parser: where it resolves, what
 * kind of link it is, and the warnings a reviewer would raise.
 */

export interface LinkInput {
  href: string;
  text: string;
  newTab: boolean;
  download: boolean;
}

export type LinkKind = 'page' | 'fragment' | 'email' | 'phone' | 'download' | 'invalid' | 'none';

export interface LinkOutcome {
  kind: LinkKind;
  /** The absolute URL the browser uses (absent when the href is missing). */
  resolved?: string;
  /** One sentence for each thing that happens, in order. */
  steps: string[];
  warnings: string[];
}

/** Link text that means nothing out of context (a screen reader's links list). */
const VAGUE = /^(click here|here|read more|more|link|this|learn more)$/i;

/** `ids` are the ids that exist on the page (so a fragment can miss). */
export function analyzeLink(
  input: LinkInput,
  pageUrl: string,
  ids?: readonly string[],
): LinkOutcome {
  const warnings: string[] = [];
  const text = input.text.trim();
  if (!text) warnings.push('No link text: a screen reader announces only "link".');
  else if (VAGUE.test(text))
    warnings.push(
      `"${text}" means nothing out of context. Screen reader users often browse a list of links; say where it goes.`,
    );

  const href = input.href.trim();
  if (!href)
    return {
      kind: 'none',
      steps: ['Without href, an <a> is not a link: it can’t be focused or clicked.'],
      warnings,
    };

  let url: URL;
  try {
    url = new URL(href, pageUrl);
  } catch {
    return { kind: 'invalid', steps: [`"${href}" is not a valid URL.`], warnings };
  }
  const page = new URL(pageUrl);
  const steps: string[] = [];
  const looksLikeDomain = /^(www\.)?[a-z0-9-]+\.(com|org|net|io|dev)\b/i.test(href);
  if (looksLikeDomain) {
    warnings.push(
      `"${href}" has no https://, so it is a relative path: the browser looks for it inside ${page.pathname.replace(/[^/]*$/, '')}.`,
    );
  }

  if (url.protocol === 'mailto:') {
    const to = decodeURIComponent(url.pathname);
    const subject = url.searchParams.get('subject');
    steps.push(`Opens the user's email app with a new message to ${to || '(nobody)'}.`);
    if (subject) steps.push(`The subject line is filled in: "${subject}".`);
    if (input.newTab) warnings.push('target="_blank" does nothing useful on a mailto: link.');
    return { kind: 'email', resolved: url.href, steps, warnings };
  }
  if (url.protocol === 'tel:') {
    steps.push(`On a phone, offers to call ${decodeURIComponent(url.pathname)}.`);
    return { kind: 'phone', resolved: url.href, steps, warnings };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return {
      kind: 'invalid',
      resolved: url.href,
      steps: [`Uses the ${url.protocol} scheme.`],
      warnings,
    };
  }

  const samePage =
    url.origin === page.origin && url.pathname === page.pathname && url.search === page.search;
  if (samePage && url.hash && !input.download) {
    const id = decodeURIComponent(url.hash.slice(1));
    steps.push(
      ids && !ids.includes(id)
        ? `No element has id="${id}", so the page doesn't move (the address still gains #${id}).`
        : `Stays on this page and scrolls to the element with id="${id}".`,
    );
    return { kind: 'fragment', resolved: url.href, steps, warnings };
  }
  if (input.download) {
    const name = url.pathname.split('/').pop() || 'download';
    if (url.origin === page.origin) {
      steps.push(`Saves ${name} to the user's downloads instead of opening it.`);
    } else {
      steps.push(`Opens ${url.href}: download is ignored for files on other sites.`);
      warnings.push(
        'The download attribute only works for same-origin URLs (and blob: or data: URLs).',
      );
    }
    return { kind: 'download', resolved: url.href, steps, warnings };
  }
  steps.push(
    input.newTab ? `Opens ${url.href} in a new tab.` : `Replaces this page with ${url.href}.`,
  );
  if (input.newTab) {
    steps.push(
      'target="_blank" implies rel="noopener": the new page can’t reach or redirect this one through window.opener.',
    );
  }
  if (url.origin !== page.origin) steps.push(`Leaves this site for ${url.host}.`);
  return { kind: 'page', resolved: url.href, steps, warnings };
}

export function toMarkup(input: LinkInput): string {
  const attrs = [
    input.href ? ` href="${input.href}"` : '',
    input.newTab ? ' target="_blank"' : '',
    input.download ? ' download' : '',
  ].join('');
  return `<a${attrs}>${input.text}</a>`;
}
