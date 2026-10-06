const img = () => $('img');

test('the photo declares its 1600 by 900 pixel size', () => {
  expect(img().getAttribute('width')).toBe('1600');
  expect(img().getAttribute('height')).toBe('900');
});

test('the alt text is unchanged', () => {
  expect(img().alt).toBe('The ridge trail above the lake at sunrise');
});
