test('both fields have a connected label', () => {
  const fields = [...document.querySelectorAll('input')];
  expect(fields.map((f) => f.labels.length)).toEqual([1, 1]);
});

test('the email field keeps id="email"', () => {
  expect(document.querySelector('input[type="email"]')?.id).toBe('email');
});
