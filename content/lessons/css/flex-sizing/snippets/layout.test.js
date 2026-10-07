const width = (selector) => document.querySelector(selector).getBoundingClientRect().width;

test('the main column takes exactly the space next to the sidebar', () => {
  expect(width('.main')).toBe(400);
});

test('the sidebar keeps its 200px', () => {
  expect(width('.sidebar')).toBe(200);
});
