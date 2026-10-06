import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { freeRoamProgress, seedProgress } from './fixtures.ts';

function challenge(page: Page, n: number): Locator {
  return page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: new RegExp(`Challenge ${n} of`) }) });
}

/** Moves list items with the explicit Move buttons (the non-drag path) into `wanted` order. */
async function reorder(list: Locator, wanted: string[]) {
  for (let target = 0; target < wanted.length; target++) {
    const texts = await list.locator('li').allTextContents();
    let at = texts.findIndex((t) => t.includes(wanted[target] as string));
    while (at > target) {
      await list.getByRole('button', { name: `Move item ${at + 1} up` }).click();
      at--;
    }
  }
}

test('completes a lesson across five challenge types', async ({ page }) => {
  await seedProgress(page, freeRoamProgress());
  await page.goto('/learn/js.json');
  await expect(page.getByRole('heading', { level: 1, name: 'JSON' })).toBeVisible();

  // predict-output: a wrong answer first, with specific feedback.
  const predict = challenge(page, 1);
  await predict.getByLabel(/Your prediction/).fill('3\n3');
  await predict.getByRole('button', { name: 'Check' }).click();
  await expect(predict).toContainText('The program prints 1 line; your answer has 2.');
  await predict.getByLabel(/Your prediction/).fill('3 3');
  await predict.getByRole('button', { name: 'Check' }).click();
  await expect(predict).toContainText('Passed');

  // fill-blank
  const blank = challenge(page, 2);
  await blank.getByLabel(/Blank 1 of 1/).fill("'Hello'");
  await blank.getByRole('button', { name: 'Check' }).click();
  await expect(blank).toContainText('Passed');

  // find-bug: wrong line, right line, then the fix.
  const bug = challenge(page, 3);
  await bug.getByRole('button', { name: 'Line 2', exact: true }).click();
  await bug.getByRole('button', { name: 'Check line' }).click();
  await expect(bug).toContainText('The bug is not on line 2.');
  await bug.getByRole('button', { name: 'Line 2', exact: true }).click();
  await bug.getByRole('button', { name: 'Line 3', exact: true }).click();
  await bug.getByRole('button', { name: 'Check line' }).click();
  await expect(bug).toContainText('Right line. Now choose the fix.');
  await bug.getByRole('radio').first().check();
  await bug.getByRole('button', { name: 'Check fix' }).click();
  await expect(bug).toContainText('Passed');

  // reorder with the keyboard-accessible Move buttons.
  const order = challenge(page, 4);
  await reorder(order.locator('ol'), ['Declare a variable', 'Assign a value', 'Log it']);
  await order.getByRole('button', { name: 'Check' }).click();
  await expect(order).toContainText('Passed');

  // live-code: the starter fails the tests, the fix passes them (real sandbox runner).
  const write = challenge(page, 5);
  await write.getByRole('button', { name: 'Run tests' }).click();
  await expect(write).toContainText('0 of 2 tests passed');
  const editor = write.getByRole('textbox', { name: 'main.js editor' });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('function double(n) {\n  return n * 2;\n}\n');
  await write.getByRole('button', { name: 'Run tests' }).click();
  await expect(write).toContainText('All 2 tests passed.');

  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible();
  // XP shows in the top bar; it survives a reload (persisted).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible();
});

test('hints are progressive and the solution can be revealed after a try', async ({ page }) => {
  await seedProgress(page, freeRoamProgress());
  await page.goto('/learn/js.json');
  const predict = challenge(page, 1);
  await predict.getByRole('button', { name: /Hint 1 of 1/ }).click();
  await expect(predict.getByRole('list', { name: 'Hints' })).toContainText('reads the last item');
  await expect(predict.getByRole('button', { name: /Show the solution/ })).toHaveCount(0);
  await predict.getByLabel(/Your prediction/).fill('nope');
  await predict.getByRole('button', { name: 'Check' }).click();
  await predict.getByRole('button', { name: /Show the solution/ }).click();
  await expect(predict).toContainText('Solution: enter it yourself to finish');
});

test('visual-match compares the rendered layout with the target', async ({ page }) => {
  await seedProgress(page, freeRoamProgress());
  await page.goto('/learn/css.overflow');
  const match = challenge(page, 1);
  await match.getByRole('button', { name: 'Compare with target' }).click();
  await expect(match).toContainText('0 of 1 elements match. .box: width is 100px, target 220px');
  await match.getByRole('textbox', { name: 'style.css editor' }).click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('.box {\n  width: 200px;\n  padding: 10px;\n}\n');
  await match.getByRole('button', { name: 'Compare with target' }).click();
  await expect(match).toContainText('Passed');
});

test('a C# lesson with an unmet recommendation shows the banner; skipping persists', async ({
  page,
}) => {
  await page.goto('/learn/cs.hello-dotnet');
  const banner = page.getByRole('complementary', { name: 'Recommended path' });
  await expect(banner).toContainText('Recommended first: Objects');
  await banner.getByRole('button', { name: 'Skip, I already know this' }).click();
  await expect(banner).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole('heading', { level: 1, name: 'From C# to running code' }),
  ).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Recommended path' })).toBeHidden();
  await page.goto('/profile');
  await expect(page.getByText('Skipped for C#')).toBeVisible();
});

test('a planned lesson says it is coming soon', async ({ page }) => {
  await page.goto('/learn/net.boss/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('coming soon');
});

test('lesson page has no axe violations', async ({ page }) => {
  await seedProgress(page, freeRoamProgress());
  await page.goto('/learn/js.json');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Ran in')).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .exclude('iframe')
    .analyze();
  expect(results.violations).toEqual([]);
});
