/** Plain text for places that cannot render inline code (document titles, meta tags). */
export function stripBackticks(text: string): string {
  return text.replaceAll('`', '');
}
