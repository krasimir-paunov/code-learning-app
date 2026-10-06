test('the article intro is italic', () => {
  expect(styleOf('article .intro', 'font-style')).toBe('italic');
});

test('the newsletter intro in the aside is not', () => {
  expect(styleOf('aside .intro', 'font-style')).toBe('normal');
});

test('the external link is orange', () => {
  expect(styleOf('a[href^="https"]', 'color')).toBe('rgb(255, 140, 0)');
});

test('the internal link is not orange', () => {
  expect(styleOf('a[href^="/"]', 'color')).not.toBe('rgb(255, 140, 0)');
});
