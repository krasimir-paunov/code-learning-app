/**
 * Which on-screen keyboard a phone typically shows for an input: the `inputmode` attribute
 * wins, otherwise the input's `type` decides. Real layouts differ between phones; these are the
 * kinds of keyboard, not exact pictures.
 */

export const INPUT_TYPES = [
  'text',
  'email',
  'tel',
  'url',
  'number',
  'date',
  'search',
  'password',
  'checkbox',
] as const;

export type InputType = (typeof INPUT_TYPES)[number];

export type InputMode =
  'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url' | 'none';

export type Keyboard =
  'letters' | 'email' | 'url' | 'search' | 'tel' | 'digits' | 'decimal' | 'picker' | 'none';

const BY_MODE: Record<InputMode, Keyboard> = {
  text: 'letters',
  decimal: 'decimal',
  numeric: 'digits',
  tel: 'tel',
  search: 'search',
  email: 'email',
  url: 'url',
  none: 'none',
};

const BY_TYPE: Record<InputType, Keyboard> = {
  text: 'letters',
  email: 'email',
  tel: 'tel',
  url: 'url',
  number: 'decimal',
  date: 'picker',
  search: 'search',
  password: 'letters',
  checkbox: 'none',
};

/** Controls that never take typed text ignore `inputmode`. */
const NO_TEXT: readonly InputType[] = ['date', 'checkbox'];

export function keyboardFor(type: InputType, inputmode?: InputMode): Keyboard {
  if (inputmode && !NO_TEXT.includes(type)) return BY_MODE[inputmode];
  return BY_TYPE[type];
}

/** Rows of keys for each typed-text keyboard; pickers and toggles have none. */
export const LAYOUTS: Partial<Record<Keyboard, string[][]>> = {
  letters: [[...'qwertyuiop'], [...'asdfghjkl'], [...'zxcvbnm'], ['123', 'space', 'return']],
  email: [
    [...'qwertyuiop'],
    [...'asdfghjkl'],
    [...'zxcvbnm'],
    ['123', '@', 'space', '.', 'return'],
  ],
  url: [[...'qwertyuiop'], [...'asdfghjkl'], [...'zxcvbnm'], ['123', '/', '.com', 'return']],
  search: [[...'qwertyuiop'], [...'asdfghjkl'], [...'zxcvbnm'], ['123', 'space', 'search']],
  tel: [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['+*#', '0', '⌫'],
  ],
  digits: [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ],
  decimal: [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫'],
  ],
};
