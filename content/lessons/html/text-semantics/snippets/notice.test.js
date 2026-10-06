const text = (selector) => $(selector)?.textContent.trim();

test('the wording is unchanged', () => {
  expect($('p').textContent).toBe(
    'Warning: do not unplug the router while update.sh runs. The next update is on 14 March.',
  );
});

test('"Warning" is marked as important', () => {
  expect(text('strong')?.replace(':', '')).toBe('Warning');
});

test('"not" is stressed', () => {
  expect(text('em')).toBe('not');
});

test('the file name is code', () => {
  expect(text('code')).toBe('update.sh');
});

test('the date is machine-readable as 2026-03-14', () => {
  expect(text('time')).toBe('14 March');
  expect($('time').dateTime).toBe('2026-03-14');
});
