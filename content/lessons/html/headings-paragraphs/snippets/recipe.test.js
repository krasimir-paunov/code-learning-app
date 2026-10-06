const headings = () => $$('h1, h2, h3, h4, h5, h6');
const level = (h) => Number(h.tagName[1]);

test('there is exactly one h1', () => {
  expect($$('h1')).toHaveLength(1);
});

test('no heading level is skipped on the way down', () => {
  const levels = headings().map(level);
  levels.forEach((l, i) => {
    if (i > 0) expect(l).toBeLessThan(levels[i - 1] + 2);
  });
});

test('Ingredients is a heading', () => {
  expect(headings().map((h) => h.textContent)).toContain('Ingredients');
});
