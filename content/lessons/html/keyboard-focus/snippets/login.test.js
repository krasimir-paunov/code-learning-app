test('no element jumps the queue with a positive tabindex', () => {
  const positive = [...document.querySelectorAll('*')].filter((el) => el.tabIndex > 0);
  expect(positive.length).toBe(0);
});

test('Log in is still a button that submits the form', () => {
  const button = document.querySelector('form button');
  expect([button?.textContent.trim(), button?.type]).toEqual(['Log in', 'submit']);
});
