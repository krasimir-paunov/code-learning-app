// The page's own script already declares `button` and `menu`, so the helpers use other names.
const toggleButton = () => document.querySelector('.toggle');
const menuList = () => document.querySelector('#menu');

test('opening the menu reports aria-expanded="true"', () => {
  menuList().hidden = true;
  toggleButton().setAttribute('aria-expanded', 'false');
  toggleButton().click();
  expect([menuList().hidden, toggleButton().getAttribute('aria-expanded')]).toEqual([false, 'true']);
});

test('closing it again reports aria-expanded="false"', () => {
  toggleButton().click();
  expect([menuList().hidden, toggleButton().getAttribute('aria-expanded')]).toEqual([true, 'false']);
});
