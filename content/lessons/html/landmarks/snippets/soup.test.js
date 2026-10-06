test('the site header is a <header> outside <main>', () => {
  const header = $('header');
  expect(header).toBeTruthy();
  expect(header.closest('main, article, section, aside, nav')).toBeNull();
});

test('the menu links are in a <nav> inside the header', () => {
  const links = $$('header nav a').map((a) => a.getAttribute('href'));
  expect(links).toEqual(['/', '/archive']);
});

test('there is exactly one <main>, and it holds the heading', () => {
  expect($$('main')).toHaveLength(1);
  expect($('main h1')?.textContent).toBe('Ten trails for spring');
});

test('the copyright is in a <footer> outside <main>', () => {
  const footer = $('footer');
  expect(footer?.textContent).toContain('2026');
  expect(footer?.closest('main')).toBeNull();
});

test('no layout divs are left for these regions', () => {
  expect($$('div.top, div.menu, div.content, div.bottom')).toHaveLength(0);
});
