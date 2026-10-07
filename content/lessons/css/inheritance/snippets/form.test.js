const font = (selector) => styleOf(selector, 'font-family');

test('the input uses the page font', () => {
  expect(font('input')).toBe(font('body'));
});

test('the button uses the page font', () => {
  expect(font('button')).toBe(font('body'));
});

test('the footer link has the footer colour', () => {
  expect(styleOf('.footer a', 'color')).toBe('rgb(154, 166, 184)');
});
