const link = () => getComputedStyle(document.querySelector('.text a'));

test('the link is underlined, so it doesn\'t rely on colour alone', () => {
  expect(link().textDecorationLine).toBe('underline');
});

test('the link keeps its colour', () => {
  expect(link().color).toBe('rgb(29, 78, 216)');
});
