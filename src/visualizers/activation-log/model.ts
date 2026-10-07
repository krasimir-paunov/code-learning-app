/**
 * How each kind of clickable element responds to the keyboard and the mouse. The view logs the
 * real events next to this table, so learners can check it themselves.
 */

export type Kind = 'link' | 'submit' | 'button' | 'div';

export interface Behavior {
  /** Reachable with Tab. */
  tab: boolean;
  enter: string;
  space: string;
  click: string;
}

export const BEHAVIOR: Record<Kind, Behavior> = {
  link: {
    tab: true,
    enter: 'follows the link',
    space: 'nothing (scrolls the page)',
    click: 'follows the link',
  },
  submit: {
    tab: true,
    enter: 'clicks, then submits the form',
    space: 'clicks, then submits the form',
    click: 'submits the form',
  },
  button: { tab: true, enter: 'clicks', space: 'clicks', click: 'runs your script' },
  div: {
    tab: false,
    enter: 'nothing (it never gets focus)',
    space: 'nothing (it never gets focus)',
    click: 'runs your script',
  },
};

export interface LogEntry {
  id: number;
  text: string;
}

/** Oldest first, so each result reads after the event that caused it; keeps the latest `max`. */
export function addEntry(log: readonly LogEntry[], text: string, max = 8): LogEntry[] {
  const id = (log.at(-1)?.id ?? 0) + 1;
  return [...log, { id, text }].slice(-max);
}
