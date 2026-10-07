test('every column has a column header', () => {
  const heads = [...document.querySelectorAll('thead tr > *')];
  expect(heads.map((cell) => `${cell.tagName} ${cell.getAttribute('scope')}`)).toEqual([
    'TH col',
    'TH col',
    'TH col',
  ]);
});

test('the header text stays Price', () => {
  expect(document.querySelectorAll('thead th')[2]?.textContent.trim()).toBe('Price');
});
