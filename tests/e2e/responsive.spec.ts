import { expect, test, type Locator, type Page } from '@playwright/test';
import { freeRoamProgress, seedProgress } from './fixtures.ts';

async function replaceCss(page: Page, scope: Locator, css: string) {
  // CodeMirror loads only once an editor nears the viewport.
  await scope.getByText(/Tab indents/).scrollIntoViewIfNeeded();
  await scope.getByRole('textbox', { name: 'style.css editor' }).click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(css);
}

test.describe('pages are measured at the widths they claim', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(
      info.project.name !== 'desktop',
      'desktop only: grading frames are the same everywhere',
    );
    await seedProgress(page, freeRoamProgress());
  });

  test('visual-match: one column only is right on phones and wrong at wider widths', async ({
    page,
  }) => {
    await page.goto('/learn/css.boss');
    const match = page.locator('#challenge-feature-grid');
    await replaceCss(
      page,
      match,
      `[data-theme="dark"] { --bg: #0f172a; --tile: #1e293b; --text: #f1f5f9; }
* { box-sizing: border-box; }
body { margin: 0; font: 16px/1.4 system-ui, sans-serif; }
.features { padding: 16px; background: var(--bg); color: var(--text); }
.heading { margin: 0 0 12px; font-size: 22px; }
.grid { display: grid; gap: 12px; }
.tile { height: 80px; padding: 12px; border-radius: 8px; background: var(--tile); }
`,
    );
    await match.getByRole('button', { name: 'Compare with target' }).click();
    await expect(match).toContainText('Matches at 1 of 3 widths. At 640px');
  });

  test('responsive-checker: the starter fails at narrow widths, the solution passes everywhere', async ({
    page,
  }) => {
    await page.goto('/learn/css.boss');
    const playground = page.locator('#playground');
    await playground.scrollIntoViewIfNeeded();
    await expect(playground.getByRole('heading', { name: /The spec/ })).toHaveText(
      'The spec: 3 of 12 checks pass',
    );
    const solution = await playground.locator('details code').textContent();
    await replaceCss(page, playground, solution ?? '');
    await expect(playground.getByRole('heading', { name: /The spec/ })).toHaveText(
      'The spec: 12 of 12 checks pass',
    );
  });
});
