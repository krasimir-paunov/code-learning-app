test('the open menu is on top of the hero', () => {
  expect(document.elementFromPoint(50, 80)?.className).toBe('menu');
});

test('the toolbar is still positioned', () => {
  expect(getComputedStyle(document.querySelector('.toolbar')).position).toBe('relative');
});
