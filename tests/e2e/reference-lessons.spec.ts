import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { freeRoamProgress, seedProgress } from './fixtures.ts';

// Their prerequisites (the first HTML lessons) are published now, so open them with Free roam.
test.beforeEach(async ({ page }) => {
  await seedProgress(page, freeRoamProgress());
});

test('binary search: trace the probes by hand', async ({ page }) => {
  await page.goto('/learn/algo.binary-search');
  const trace = page.locator('#challenge-trace-probes');
  for (const [index, value] of [
    [4, 16],
    [7, 56],
    [5, 23],
  ]) {
    await trace.getByRole('button', { name: `Index ${index}, value ${value}` }).click();
  }
  await expect(trace).toContainText('All 3 steps, in order.');
  await expect(trace).toContainText('Passed');
});

test('binary search: the off-by-one fix and the implementation pass their tests', async ({
  page,
}) => {
  await page.goto('/learn/algo.binary-search');
  const bug = page.locator('#challenge-off-by-one');
  await bug.getByRole('button', { name: 'Line 4', exact: true }).click();
  await bug.getByRole('button', { name: 'Check line' }).click();
  await bug.getByRole('radio').first().check();
  await bug.getByRole('button', { name: 'Check fix' }).click();
  await expect(bug).toContainText('Passed');

  const implement = page.locator('#challenge-implement');
  await implement.scrollIntoViewIfNeeded();
  await implement.getByRole('textbox', { name: 'main.js editor' }).click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(
    'function binarySearch(xs, target) {\n  let lo = 0;\n  let hi = xs.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (xs[mid] === target) return mid;\n    if (xs[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}\n',
  );
  await implement.getByRole('button', { name: 'Run tests' }).click();
  await expect(implement).toContainText('All 4 tests passed.');
});

test('binary search: the race steps through with live counters', async ({ page }) => {
  await page.goto('/learn/algo.binary-search');
  const playground = page.locator('#playground');
  await expect(playground.getByText('0 / ')).toBeVisible();
  await playground.getByRole('button', { name: 'Step forward' }).click();
  await playground.getByRole('button', { name: 'Step forward' }).click();
  await expect(playground.getByText(/^2 \/ \d+$/)).toBeVisible();
  await playground.getByRole('switch', { name: /Step mode/ }).click();
  await expect(playground.getByRole('list', { name: 'Binary search code' })).toBeVisible();
});

test('box model: the fill-blank and visual-match challenges accept the right CSS', async ({
  page,
}) => {
  await page.goto('/learn/css.box-model');
  const blank = page.locator('#challenge-content-width');
  await blank.getByLabel(/Blank 1 of 1/).fill('248px');
  await blank.getByRole('button', { name: 'Check' }).click();
  await expect(blank).toContainText('Passed');

  const match = page.locator('#challenge-match-card');
  // CodeMirror loads only once an editor nears the viewport.
  await match.scrollIntoViewIfNeeded();
  await match.getByRole('textbox', { name: 'style.css editor' }).click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(
    '.card {\n  width: 224px;\n  padding: 16px;\n  border: 2px solid #5d6e87;\n  margin: 24px;\n  background: #e8f1ff;\n}\n\n.title {\n  margin: 0;\n}\n',
  );
  await match.getByRole('button', { name: 'Compare with target' }).click();
  await expect(match).toContainText('Passed');
});

test('both reference lessons are on the map and have no axe violations', async ({ page }) => {
  await page.goto('/map/algo.searching?view=map');
  await expect(page.getByRole('button', { name: /Binary search/ })).toBeVisible();
  for (const url of ['/learn/css.box-model', '/learn/algo.binary-search']) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .exclude('iframe')
      .analyze();
    expect(results.violations, url).toEqual([]);
  }
});

test('with reduced motion the race never plays by itself', async ({ page }, info) => {
  test.skip(info.project.name !== 'reduced-motion', 'reduced-motion project only');
  await page.goto('/learn/algo.binary-search');
  await page.waitForTimeout(1500);
  await expect(page.locator('#playground').getByText(/^0 \/ \d+$/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.effects)).toBe('reduced');
});
