import { accessibleName, LANDMARK_ROLES, role } from '../shared/a11y/a11y.ts';

export const REGION_TAGS = [
  'div',
  'header',
  'nav',
  'main',
  'article',
  'section',
  'aside',
  'footer',
] as const;
export type RegionTag = (typeof REGION_TAGS)[number];

export interface Region {
  id: string;
  /** What the block contains, written into the page as its text. */
  label: string;
  /** Tags that fit the block's purpose (the first is the best fit). */
  want: RegionTag[];
  /** Placed beside the previous top-level region on wide screens (a sidebar). */
  side?: boolean;
  children?: Region[];
}

export type Choices = Record<string, RegionTag>;

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

/** The page as markup: every region becomes its chosen element with its label as text. */
export function toHtml(
  regions: readonly Region[],
  choices: Choices,
  { annotate = true, depth = 0 }: { annotate?: boolean; depth?: number } = {},
): string {
  const pad = '  '.repeat(depth);
  return regions
    .map((region) => {
      const tag = choices[region.id] ?? 'div';
      const inner = [
        `${pad}  ${escape(region.label)}`,
        ...(region.children?.length
          ? [toHtml(region.children, choices, { annotate, depth: depth + 1 })]
          : []),
      ].join('\n');
      // The data attribute lets `analyze` find each region in the parsed page.
      const attr = annotate ? ` data-region="${region.id}"` : '';
      return `${pad}<${tag}${attr}>\n${inner}\n${pad}</${tag}>`;
    })
    .join('\n');
}

export function allRegions(regions: readonly Region[]): Region[] {
  return regions.flatMap((r) => [r, ...allRegions(r.children ?? [])]);
}

export interface RegionResult {
  id: string;
  label: string;
  tag: RegionTag;
  /** The role assistive technology gets for the chosen element in this position. */
  role: string;
  landmark: boolean;
  fits: boolean;
}

/** Roles come from parsing the generated page, so position-dependent rules apply. */
export function analyze(regions: readonly Region[], choices: Choices): RegionResult[] {
  const doc = new DOMParser().parseFromString(toHtml(regions, choices), 'text/html');
  return allRegions(regions).map((region) => {
    const element = doc.querySelector(`[data-region="${region.id}"]`);
    const tag = choices[region.id] ?? 'div';
    const r = element ? role(element) : 'generic';
    return {
      id: region.id,
      label: region.label,
      tag,
      role: r,
      landmark:
        LANDMARK_ROLES.has(r) && (r !== 'region' || Boolean(element && accessibleName(element))),
      fits: region.want.includes(tag),
    };
  });
}

/** Problems a reviewer would raise: more than one main, no main at all. */
export function pageIssues(results: readonly RegionResult[]): string[] {
  const mains = results.filter((r) => r.role === 'main').length;
  if (mains === 0) return ['No <main>: screen reader users can’t jump straight to the content.'];
  if (mains > 1) return [`${mains} <main> elements: a page has exactly one.`];
  return [];
}
