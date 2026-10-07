/**
 * What assistive technology gets from a control, as one line, and whether a region announces
 * its changes. Real screen readers word things differently; the parts are the same.
 */

export interface AxInfo {
  role: string;
  name: string;
  description: string;
  states: readonly string[];
}

/** Roles people operate: they must have a name. Regions such as status can do without. */
const CONTROLS = new Set([
  'button',
  'link',
  'textbox',
  'searchbox',
  'checkbox',
  'radio',
  'combobox',
  'switch',
  'slider',
]);

export function needsName(role: string): boolean {
  return CONTROLS.has(role);
}

/** "Close, button" / "Menu, button, collapsed. Opens the site menu." */
export function speak(info: AxInfo): string {
  const name = info.name || (needsName(info.role) ? '(no name)' : '');
  const head = [name, info.role, ...info.states].filter(Boolean).join(', ');
  return info.description ? `${head}. ${info.description}` : head;
}

export type Politeness = 'polite' | 'assertive' | null;

/** Live regions: an explicit aria-live wins; otherwise some roles imply one. */
export function liveness(role: string | null, ariaLive: string | null): Politeness {
  if (ariaLive === 'polite' || ariaLive === 'assertive') return ariaLive;
  if (ariaLive === 'off') return null;
  if (role === 'status' || role === 'log') return 'polite';
  if (role === 'alert') return 'assertive';
  return null;
}
