test('"Show password" does not submit the form', () => {
  let submitted = 0;
  const form = document.querySelector('form');
  const count = (event) => {
    event.preventDefault();
    submitted++;
  };
  form.addEventListener('submit', count);
  document.querySelector('.show').click();
  form.removeEventListener('submit', count);
  expect(submitted).toBe(0);
});

test('"Show password" reveals the password and keeps what was typed', () => {
  const field = document.querySelector('#password');
  field.type = 'password';
  field.value = 'trail-42';
  document.querySelector('.show').click();
  expect([field.type, field.value]).toEqual(['text', 'trail-42']);
});

test('"Show password" is a real button, so the keyboard can reach it', () => {
  expect(document.querySelector('.show').tagName).toBe('BUTTON');
});
