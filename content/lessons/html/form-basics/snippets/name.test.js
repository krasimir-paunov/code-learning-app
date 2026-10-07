const form = () => document.querySelector('form');

test('the email address is sent', () => {
  expect(new FormData(form()).has('email')).toBe(true);
});

test('the Email label is still connected to its field', () => {
  expect(document.querySelector('input[type="email"]').labels.length).toBe(1);
});
