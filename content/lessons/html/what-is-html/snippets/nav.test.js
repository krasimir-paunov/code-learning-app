const links = () => $$('nav a');

test('the nav has three links', () => {
  expect(links()).toHaveLength(3);
});

test('Docs links to /docs', () => {
  const docs = links()[1];
  expect(docs.textContent).toBe('Docs');
  expect(docs.getAttribute('href')).toBe('/docs');
});

test('Blog links to /blog', () => {
  expect(links()[2].getAttribute('href')).toBe('/blog');
});
