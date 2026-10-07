const field = (name) => document.querySelector(`[name="${name}"]`);

test('the email field is type="email" with autocomplete="email"', () => {
  expect([field('email')?.type, field('email')?.getAttribute('autocomplete')]).toEqual(['email', 'email']);
});

test('the phone field is type="tel" with autocomplete="tel"', () => {
  expect([field('phone')?.type, field('phone')?.getAttribute('autocomplete')]).toEqual(['tel', 'tel']);
});

test('the name field asks autofill for the full name', () => {
  expect(field('name')?.getAttribute('autocomplete')).toBe('name');
});

test('every field keeps its label', () => {
  expect(['name', 'email', 'phone'].map((n) => field(n)?.labels.length)).toEqual([1, 1, 1]);
});
