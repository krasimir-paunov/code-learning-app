const field = (name) => document.querySelector(`[name="${name}"]`);

test('the page has a header, a main and one h1', () => {
  expect([!!document.querySelector('header'), !!document.querySelector('main'), document.querySelectorAll('h1').length]).toEqual([
    true,
    true,
    1,
  ]);
});

test('the form posts its data', () => {
  expect(document.querySelector('form')?.method).toBe('post');
});

test('every text field has a visible label', () => {
  expect(['name', 'email', 'date', 'group'].map((n) => field(n)?.labels.length ?? 0)).toEqual([1, 1, 1, 1]);
});

test('each field has the right type', () => {
  expect(['email', 'date', 'group'].map((n) => field(n)?.type)).toEqual(['email', 'date', 'number']);
});

test('the group size is checked: 1 to 8 people', () => {
  expect([field('group')?.min, field('group')?.max]).toEqual(['1', '8']);
});

test('all four fields are required', () => {
  expect(['name', 'email', 'date', 'group'].every((n) => field(n)?.required)).toBe(true);
});

test('experience is one radio group in a fieldset with a legend', () => {
  const radios = [...document.querySelectorAll('input[type="radio"]')];
  const fieldset = radios[0]?.closest('fieldset');
  expect([radios.length, new Set(radios.map((r) => r.name)).size, !!radios[0]?.name]).toEqual([2, 1, true]);
  expect(fieldset?.querySelector(':scope > legend')?.textContent.trim()).toBe('Experience');
});

test('each radio has its own label', () => {
  expect([...document.querySelectorAll('input[type="radio"]')].every((r) => r.labels.length === 1)).toBe(true);
});

test('a real button submits the form', () => {
  const button = document.querySelector('form button');
  expect([button?.textContent.trim(), button?.type]).toEqual(['Book', 'submit']);
});
