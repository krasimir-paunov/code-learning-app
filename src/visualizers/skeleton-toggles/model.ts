/**
 * The HTML boilerplate as switchable lines, and what each missing line costs. Pure: the view
 * renders the consequences, this decides them.
 */

export type SkeletonLine = 'doctype' | 'lang' | 'charset' | 'viewport' | 'title';

export type Toggles = Record<SkeletonLine, boolean>;

export const ALL_ON: Toggles = {
  doctype: true,
  lang: true,
  charset: true,
  viewport: true,
  title: true,
};

export interface PageText {
  title: string;
  heading: string;
  body: string[];
  /** BCP 47 language tag written into `lang`. */
  lang: string;
  /** What the tab shows when there is no title (the file name). */
  fileName: string;
}

/** The source lines, each tagged with the toggle that removes or changes it. */
export function documentLines(
  page: PageText,
  on: Toggles,
): { text: string; line?: SkeletonLine }[] {
  return [
    { text: '<!doctype html>', line: 'doctype' },
    { text: on.lang ? `<html lang="${page.lang}">` : '<html>', line: 'lang' },
    { text: '<head>' },
    { text: '  <meta charset="utf-8">', line: 'charset' },
    {
      text: '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      line: 'viewport',
    },
    { text: `  <title>${page.title}</title>`, line: 'title' },
    { text: '</head>' },
    { text: '<body>' },
    { text: `  <h1>${page.heading}</h1>` },
    ...page.body.map((p) => ({ text: `  <p>${p}</p>` })),
    { text: '</body>' },
    { text: '</html>' },
  ];
}

/** The document as written, with switched-off lines left out (`lang` is an attribute). */
export function assemble(page: PageText, on: Toggles): string {
  return documentLines(page, on)
    .filter((l) => l.line === undefined || l.line === 'lang' || on[l.line])
    .map((l) => l.text)
    .join('\n');
}

/**
 * What a reader sees when UTF-8 bytes are decoded as Windows-1252, a common wrong guess when
 * neither the page nor the server declares the encoding.
 */
export function misdecoded(text: string): string {
  return Array.from(new TextEncoder().encode(text), (byte) =>
    String.fromCodePoint(
      byte >= 0x80 && byte <= 0x9f ? (WINDOWS_1252_HIGH[byte - 0x80] as number) : byte,
    ),
  ).join('');
}

/**
 * Code points for bytes 0x80-0x9F (WHATWG Encoding Standard index); every other byte maps to
 * itself. Spelled out because some runtimes' TextDecoder treats windows-1252 as Latin-1.
 */
const WINDOWS_1252_HIGH = [
  8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 141, 381, 143, 144, 8216,
  8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 157, 382, 376,
];

/** A phone lays out pages at its device width only when told to; otherwise at 980 CSS px. */
export const PHONE_WIDTH = 375;
export const LEGACY_LAYOUT_WIDTH = 980;

export function phoneLayoutWidth(on: Toggles): number {
  return on.viewport ? PHONE_WIDTH : LEGACY_LAYOUT_WIDTH;
}

/** Text appears at this fraction of its CSS size on the phone screen. */
export function phoneTextScale(on: Toggles): number {
  return PHONE_WIDTH / phoneLayoutWidth(on);
}

export function tabLabel(page: PageText, on: Toggles): string {
  return on.title ? page.title : page.fileName;
}
