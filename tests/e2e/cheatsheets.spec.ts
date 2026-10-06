import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('search finds entries across every sheet, "/" focuses it', async ({ page }) => {
  await page.goto('/cheatsheets/css');
  await expect(page.getByRole('heading', { level: 1, name: 'CSS cheat sheet' })).toBeVisible();
  await page.keyboard.press('/');
  const search = page.getByRole('searchbox', { name: 'Search all cheat sheets' });
  await expect(search).toBeFocused();
  await search.fill('TryGetValue');
  await expect(page.getByRole('heading', { level: 2, name: 'C#' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Look up without exceptions' })).toBeVisible();
  await search.fill('zzzzqqq');
  await expect(page.getByText('Nothing matches')).toBeVisible();
});

test('the usage filter narrows a sheet', async ({ page }) => {
  await page.goto('/cheatsheets/js');
  const entries = page.locator('main article');
  await expect(entries.first()).toBeVisible();
  const all = await entries.count();
  await page.getByRole('button', { name: /Rare/ }).click();
  await expect(page.getByRole('button', { name: /Rare/ })).toHaveAttribute('aria-pressed', 'true');
  expect(await entries.count()).toBeLessThan(all);
});

test('Learn links appear only for published lessons', async ({ page }) => {
  await page.goto('/cheatsheets/algo');
  const binary = page.locator('article', {
    has: page.getByRole('heading', { name: 'Binary search' }),
  });
  await expect(binary.getByRole('link', { name: /Learn it/ })).toBeVisible();
  const twoSum = page.locator('article', { has: page.getByRole('heading', { name: /two sum/ }) });
  await expect(twoSum.getByRole('link', { name: /Learn it/ })).toHaveCount(0);
});

test('entries deep-link by id and show verified output', async ({ page }) => {
  await page.goto('/cheatsheets/cs#cs.sheet.record');
  const record = page.locator('[id="cs.sheet.record"]');
  await expect(record).toBeInViewport();
  await expect(record).toContainText('Point { X = 1, Y = 5 }');
});

test('cheat sheets have no axe violations', async ({ page }) => {
  for (const url of ['/cheatsheets', '/cheatsheets/algo', '/cheatsheets/js']) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, url).toEqual([]);
  }
});
