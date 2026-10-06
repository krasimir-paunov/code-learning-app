import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { PROGRESS_KEY, sampleProgress, seedProgress } from './fixtures.ts';

test('export → clear storage → import restores progress exactly', async ({ page }, testInfo) => {
  const original = sampleProgress();
  await seedProgress(page, original);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-progress-\d{4}-\d{2}-\d{2}\.json$/);
  const file = testInfo.outputPath('backup.json');
  await download.saveAs(file);
  const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(backup.format).toBe('pneon-progress');

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('Lessons completed').locator('..')).toContainText('0');

  await page.locator('input[type="file"]').setInputFiles(file);
  const dialog = page.getByRole('dialog', { name: 'Import this backup?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('row', { name: /Lessons completed/ })).toContainText('1');
  await dialog.getByRole('button', { name: 'Replace' }).click();
  await expect(page.getByText('Progress replaced from the backup.')).toBeVisible();

  // Wait for the debounced write, then compare storage byte for byte with the original.
  await expect
    .poll(async () => page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY))
    .toBe(JSON.stringify(original));
});

test('a damaged backup is rejected with a specific message and nothing changes', async ({
  page,
}, testInfo) => {
  await seedProgress(page, sampleProgress());
  await page.goto('/profile');
  const file = testInfo.outputPath('broken.json');
  fs.writeFileSync(
    file,
    JSON.stringify({ format: 'pneon-progress', progress: { schemaVersion: 1 } }),
  );
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole('alert')).toContainText('Progress data is damaged');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('the level-up moment plays once per level', async ({ page }) => {
  // 72 + 8 + 20 = 100 XP: exactly level 2, which has not been celebrated yet.
  const progress = sampleProgress();
  progress.lessons['css.box-model'].challenges['match-card'].xp = 72;
  await seedProgress(page, progress);
  await page.goto('/profile');
  const dialog = page.getByRole('dialog', { name: /Level 2/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep going' }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('profile page has no axe violations', async ({ page }) => {
  await seedProgress(page, sampleProgress());
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
