import { expect, test } from '@playwright/test';

test('the app boots and has a title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('navigation moves focus to the page heading; only keyboard users see its ring', async ({
  page,
}) => {
  const outline = () =>
    page.evaluate(() => {
      const active = document.activeElement;
      return active ? [active.tagName, getComputedStyle(active).outlineStyle] : [];
    });

  await page.goto('/profile');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await nav.getByRole('link', { name: 'Map' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Skill map' })).toBeFocused();
  expect(await outline()).toEqual(['H1', 'none']);

  await nav.getByRole('link', { name: 'Profile' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeFocused();
  expect(await outline()).toEqual(['H1', 'solid']);
});
