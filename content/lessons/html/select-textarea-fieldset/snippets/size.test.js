const radios = () => [...document.querySelectorAll('input[type="radio"]')];

test('the sizes are a group named by its legend', () => {
  const fieldset = radios()[0]?.closest('fieldset');
  expect(fieldset?.querySelector(':scope > legend')?.textContent.trim()).toBe('Size');
  expect(radios().every((r) => r.closest('fieldset') === fieldset)).toBe(true);
});

test('the radios share name="size" and keep their values', () => {
  expect(radios().map((r) => `${r.name}=${r.value}`)).toEqual(['size=s', 'size=m', 'size=l']);
});

test('the gift message is a labelled textarea named message', () => {
  const area = document.querySelector('textarea');
  expect([area?.name, area?.labels.length, area?.labels[0]?.textContent.trim()]).toEqual([
    'message',
    1,
    'Gift message',
  ]);
});

test('the old paragraphs are gone', () => {
  expect(document.querySelectorAll('p').length).toBe(0);
});
