import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { freeRoamProgress, seedProgress } from './fixtures.ts';

/** Every published lesson in content/ (fixtures have their own specs). */
const LESSONS = readdirSync('content/lessons').flatMap((track) =>
  readdirSync(join('content/lessons', track)).map((slug) => {
    const lesson = parse(
      readFileSync(join('content/lessons', track, slug, 'lesson.yaml'), 'utf8'),
    ) as { id: string; title: string };
    return { id: lesson.id, title: lesson.title };
  }),
);

for (const lesson of LESSONS) {
  test(`${lesson.id}: every section renders, no errors, no axe violations`, async ({
    page,
  }, info) => {
    test.skip(info.project.name === 'reduced-motion', 'covered by desktop and mobile');
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await seedProgress(page, freeRoamProgress());
    await page.goto(`/learn/${lesson.id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: lesson.title.replaceAll('`', '') }),
    ).toBeVisible();

    // Scroll through so every lazily mounted view loads.
    for (const id of ['playground', 'challenges', 'production', 'mistake', 'recap']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    }
    await expect(page.locator('#playground')).not.toContainText('Unknown visualizer');
    await expect(page.locator('#challenges')).not.toContainText('Unknown challenge type');
    await expect(page.getByText(/^loading /)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByText('Something went wrong')).toHaveCount(0);

    const results = await new AxeBuilder({ page }).include('main').exclude('iframe').analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}
