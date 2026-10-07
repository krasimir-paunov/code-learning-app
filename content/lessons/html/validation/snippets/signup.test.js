const input = (name) => document.querySelector(`[name="${name}"]`);
const check = (name, value) => {
  const field = input(name);
  field.value = value;
  return field.validity;
};

test('every field is required', () => {
  expect(['user', 'email', 'age'].map((n) => check(n, '').valueMissing)).toEqual([true, true, true]);
});

test('usernames are 3 to 20 characters', () => {
  expect([input('user')?.minLength, input('user')?.maxLength]).toEqual([3, 20]);
});

test('the email must look like an email address', () => {
  expect(check('email', 'ana(at)example.com').typeMismatch).toBe(true);
  expect(check('email', 'ana@example.com').valid).toBe(true);
});

test('people must be at least 16', () => {
  expect(check('age', '15').rangeUnderflow).toBe(true);
  expect(check('age', '16').valid).toBe(true);
});

test('errors are styled with :user-invalid, not :invalid', () => {
  const selectors = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules].map((r) => r.selectorText ?? ''));
  expect(selectors.some((s) => s.includes(':user-invalid'))).toBe(true);
  expect(selectors.some((s) => /:invalid/.test(s.replaceAll(':user-invalid', '')))).toBe(false);
});
