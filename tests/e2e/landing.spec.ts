import { expect, test, type Locator, type Page } from '@playwright/test';

const raceSection = (page: Page) => page.getByRole('region', { name: 'Watch algorithms race' });
const lane = (page: Page, name: string) => raceSection(page).getByRole('region', { name });
const button = (page: Page, name: string) => raceSection(page).getByRole('button', { name });
const counter = (region: Locator, label: string) =>
  region.getByText(label, { exact: true }).locator('xpath=following-sibling::*[1]');

async function openPausedRace(page: Page) {
  await page.goto('/');
  await raceSection(page).scrollIntoViewIfNeeded();
  // With full effects it may or may not have started by now; Play then Pause pins it down.
  const play = button(page, 'Play');
  await expect(play.or(button(page, 'Pause'))).toBeVisible();
  if (await play.isVisible()) await play.click();
  await button(page, 'Pause').click();
  await expect(play).toBeVisible();
}

test('landing race: merge sort counts writes; step, restart and new array', async ({ page }) => {
  await openPausedRace(page);
  const bubble = lane(page, 'Bubble sort');
  const merge = lane(page, 'Merge sort');
  await expect(merge.getByText('Writes', { exact: true })).toBeVisible();
  await expect(merge.getByText('Swaps', { exact: true })).toHaveCount(0);
  await expect(lane(page, 'Quicksort').getByText('Swaps', { exact: true })).toBeVisible();

  await button(page, 'Restart').click();
  await expect(counter(bubble, 'Comparisons')).toHaveText('0');
  const step = button(page, 'Step');
  await step.click();
  await step.click();
  await expect(counter(bubble, 'Comparisons')).not.toHaveText('0');
  await expect(counter(merge, 'Comparisons')).toHaveText('1');
  await expect(counter(merge, 'Writes')).toHaveText('1');

  await button(page, 'Restart').click();
  await expect(counter(bubble, 'Comparisons')).toHaveText('0');
  await expect(button(page, 'Play')).toBeVisible();

  const bars = () =>
    bubble
      .locator('[role="img"] > *')
      .evaluateAll((cells) =>
        cells.map((c) => (c.firstElementChild as HTMLElement).style.blockSize),
      );
  const before = await bars();
  await button(page, 'New array').click();
  await expect.poll(bars).not.toEqual(before);
});

test('landing race: plays to a finished state with Restart up front', async ({ page }) => {
  await page.clock.install();
  await openPausedRace(page);
  await button(page, 'Play').click();
  // One jump: playback advances by elapsed time, so the next frame lands on the finish.
  await page.clock.fastForward(120_000);
  await page.clock.runFor(100);
  await expect(
    raceSection(page).getByRole('status').filter({ hasText: 'Finished.' }),
  ).toBeVisible();
  const restart = button(page, 'Restart');
  await expect(restart).toHaveCount(1);
  await expect(button(page, 'Step')).toHaveCount(0);
  await restart.click();
  await page.clock.runFor(500);
  await expect(raceSection(page).getByRole('status').filter({ hasText: 'Finished.' })).toHaveCount(
    0,
  );
});

test('with reduced motion the landing race waits for Play', async ({ page }, info) => {
  test.skip(info.project.name !== 'reduced-motion', 'reduced-motion project only');
  await page.goto('/');
  await raceSection(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await expect(button(page, 'Play')).toBeVisible();
  await expect(counter(lane(page, 'Bubble sort'), 'Comparisons')).toHaveText('0');
});
