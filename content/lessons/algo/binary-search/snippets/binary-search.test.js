test('finds a value in the middle', () => {
  expect(binarySearch([1, 3, 5, 7, 9], 7)).toBe(3);
});
test('finds the first and last values', () => {
  expect(binarySearch([1, 3, 5, 7, 9], 1)).toBe(0);
  expect(binarySearch([1, 3, 5, 7, 9], 9)).toBe(4);
});
test('finds the only value', () => {
  expect(binarySearch([42], 42)).toBe(0);
});
test('returns -1 when the value is missing', () => {
  expect(binarySearch([1, 3, 5, 7, 9], 4)).toBe(-1);
  expect(binarySearch([], 1)).toBe(-1);
});
