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
    // Desktop uses the largest editor font a learner can pick, so long code lines overflow on
    // every platform and editor scroll areas are always checked.
    const progress = freeRoamProgress();
    if (info.project.name === 'desktop') progress.settings.editorFontSize = 24;
    await seedProgress(page, progress);
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
    // Nothing may push the page sideways, on any screen size.
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways).toBeLessThanOrEqual(0);

    // Contrast demos fail on purpose (WCAG 1.4.3 exempts text that is part of a picture); the
    // same information is always given as readable text next to them. ARIA demos start broken
    // on purpose too (a nameless icon button): the lesson is about fixing them.
    const results = await new AxeBuilder({ page })
      .include('main')
      .exclude('iframe')
      .exclude('[data-contrast-demo]')
      .exclude('[data-a11y-demo]')
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

    // WCAG 1.4.12 text spacing widens text much as other platforms' fonts do. Whatever then
    // scrolls must stay reachable from the keyboard, and the page must still not scroll sideways.
    await page.addStyleTag({
      content:
        '* { letter-spacing: 0.12em !important; word-spacing: 0.16em !important; line-height: 1.5 !important; }',
    });
    const spaced = await new AxeBuilder({ page })
      .include('main')
      .exclude('iframe')
      .withRules(['scrollable-region-focusable'])
      .analyze();
    expect(spaced.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}
