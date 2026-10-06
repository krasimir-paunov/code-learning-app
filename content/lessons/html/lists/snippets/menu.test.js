const topItems = () => $$('nav > ul > li');
const hrefOf = (li) => li.querySelector(':scope > a')?.getAttribute('href');

test('the nav holds one list with three items', () => {
  expect(topItems()).toHaveLength(3);
});

test('each top item is a link to /, /shop and /about', () => {
  expect(topItems().map(hrefOf)).toEqual(['/', '/shop', '/about']);
});

test('Shop contains a nested list of two links', () => {
  const shop = topItems()[1];
  const links = shop ? Array.from(shop.querySelectorAll(':scope > ul > li > a')) : [];
  expect(links.map((a) => a.getAttribute('href'))).toEqual(['/shop/shoes', '/shop/bags']);
});

test('no list sits directly inside another list', () => {
  expect($$('ul > ul, ul > ol, ol > ul, ol > ol')).toHaveLength(0);
});
