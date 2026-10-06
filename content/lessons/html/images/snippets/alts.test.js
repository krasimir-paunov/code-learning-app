test('every image has an alt attribute', () => {
  expect($$('img').filter((img) => !img.hasAttribute('alt'))).toHaveLength(0);
});

test('the logo link says it goes to the home page', () => {
  expect($('.logo').alt.toLowerCase()).toContain('home');
});

test('the divider is decorative: alt=""', () => {
  expect($('.divider').getAttribute('alt')).toBe('');
});

test('the product photo describes the shoe', () => {
  const alt = $('.product').alt;
  expect(alt.toLowerCase()).toContain('shoe');
  expect(/\.(jpe?g|png|svg)$/i.test(alt)).toBe(false);
  expect(/^(image|picture|photo) of/i.test(alt)).toBe(false);
});
