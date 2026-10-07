/**
 * Built-in validation: each constraint attribute sets one flag on the input's ValidityState.
 * The browser computes the flags; this module names which flag belongs to which constraint and
 * says in words what it means.
 */

export type Flag =
  | 'valueMissing'
  | 'typeMismatch'
  | 'patternMismatch'
  | 'tooShort'
  | 'tooLong'
  | 'rangeUnderflow'
  | 'rangeOverflow'
  | 'stepMismatch'
  | 'badInput';

export interface Constraint {
  attr: 'required' | 'type' | 'pattern' | 'minlength' | 'maxlength' | 'min' | 'max' | 'step';
  value?: string;
}

/** The flag a constraint controls; `type` only checks a format for email and url. */
export function flagFor(constraint: Constraint): Flag | null {
  switch (constraint.attr) {
    case 'required':
      return 'valueMissing';
    case 'type':
      return constraint.value === 'email' || constraint.value === 'url' ? 'typeMismatch' : null;
    case 'pattern':
      return 'patternMismatch';
    case 'minlength':
      return 'tooShort';
    case 'maxlength':
      return 'tooLong';
    case 'min':
      return 'rangeUnderflow';
    case 'max':
      return 'rangeOverflow';
    case 'step':
      return 'stepMismatch';
  }
}

export const FLAG_TEXT: Record<Flag, string> = {
  valueMissing: 'required, but empty',
  typeMismatch: 'not in the format of its type',
  patternMismatch: 'does not match the pattern',
  tooShort: 'shorter than minlength',
  tooLong: 'longer than maxlength',
  rangeUnderflow: 'below min',
  rangeOverflow: 'above max',
  stepMismatch: 'not a multiple of step',
  badInput: 'the browser cannot read it as a number',
};

/** The markup for an input with the given constraints switched on. */
export function inputMarkup(
  id: string,
  name: string,
  type: string,
  constraints: readonly Constraint[],
): string {
  const attrs = constraints
    .filter((c) => c.attr !== 'type')
    .map((c) => (c.value === undefined ? ` ${c.attr}` : ` ${c.attr}="${c.value}"`))
    .join('');
  return `<input type="${type}" id="${id}" name="${name}"${attrs}>`;
}
