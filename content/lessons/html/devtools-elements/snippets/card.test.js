test('the price is orange', () => {
  expect(styleOf('.price', 'color')).toBe('rgb(255, 180, 84)');
});

test('the title keeps the default colour', () => {
  expect(styleOf('.title', 'color')).not.toBe('rgb(255, 180, 84)');
});
