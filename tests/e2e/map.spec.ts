import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the list view shows every planned lesson and the Core filter hides depth lessons', async ({
  page,
}) => {
  await page.goto('/map?view=list');
  const lessons = page.locator('main ol > li');
  await expect(lessons).toHaveCount(273);
  await page.getByRole('radio', { name: 'Core only' }).click();
  await expect(lessons).toHaveCount(207);
  await expect(page).toHaveURL(/tier=core/);
});

test('a module deep link opens the module zoom (static route shell)', async ({ page }) => {
  const response = await page.goto('/map/css.box-model-and-units/?view=map');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Box model and units' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('CSS');
});

test('the overview draws every module as a card in its track lane', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'the overview is the desktop default');
  await page.goto('/map');
  await expect(page.getByRole('heading', { level: 2, name: '.NET' })).toBeVisible();
  await expect(page.locator('main a[data-nav]')).toHaveCount(63);
});

test('map pages have no axe violations', async ({ page }) => {
  for (const url of ['/map?view=list', '/map?view=map', '/map/algo.searching?view=map']) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, url).toEqual([]);
  }
});

test('the overview draws lines between tracks only for the hovered or focused module', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'mobile', 'the overview is the desktop default');
  await page.goto('/map');
  const lines = page.locator('main svg path');
  // The map draws lazily; take the baseline once its in-track lines are there.
  await expect.poll(() => lines.count()).toBeGreaterThan(0);
  const resting = await lines.count();
  // The C# track's first module recommends the JavaScript fundamentals.
  const card = page.getByRole('link', { name: /The C# toolchain/ });
  await card.hover();
  await expect.poll(() => lines.count()).toBeGreaterThan(resting);
  await page.mouse.move(0, 0);
  await expect.poll(() => lines.count()).toBe(resting);
  await card.focus();
  await expect.poll(() => lines.count()).toBeGreaterThan(resting);
});
