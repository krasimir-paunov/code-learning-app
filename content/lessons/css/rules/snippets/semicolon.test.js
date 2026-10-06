test('the price is orange', () => {
  expect(styleOf('.price', 'color')).toBe('rgb(255, 140, 0)');
});

test('the price is bold', () => {
  expect(styleOf('.price', 'font-weight')).toBe('700');
});
