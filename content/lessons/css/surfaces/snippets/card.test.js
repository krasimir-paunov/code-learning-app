const card = () => getComputedStyle($('.card'));
const img = () => getComputedStyle($('.card img'));
const px = (value) => Number.parseFloat(value);

test('the card has rounded corners of at least 8px', () => {
  expect(px(card().borderTopLeftRadius)).toBeGreaterThan(7.9);
});

test('a shadow falls below the card', () => {
  const shadow = card().boxShadow;
  expect(shadow === 'none' || shadow.includes('inset')).toBe(false);
  // Computed shadows read "color x y blur spread"; the y offset is the second length.
  const [, y] = shadow.match(/-?[\d.]+px/g) ?? [];
  expect(px(y)).toBeGreaterThan(0);
});

test("the photo's top corners are rounded too", () => {
  const clipped = ['hidden', 'clip'].includes(card().overflowX);
  const rounded = px(img().borderTopLeftRadius) > 0 && px(img().borderTopRightRadius) > 0;
  expect(clipped || rounded).toBe(true);
});
