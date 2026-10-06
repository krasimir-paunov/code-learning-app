import type { Curriculum } from '../../src/engine/content/curriculum-schema.ts';
import type { SkillManifest } from '../../src/engine/skilltree/types.ts';
import type { MdTrack } from './curriculum-md.ts';

/**
 * docs/CURRICULUM.md (plan) and content/curriculum.yaml (machine truth) must agree on every
 * lesson id, its module and order, tier, title, minutes, objective and prerequisites; a lesson
 * is published exactly when its status is `done`.
 */
export function checkParity(
  md: MdTrack[],
  curriculum: Curriculum,
  manifest: SkillManifest,
): string[] {
  const issues: string[] = [];
  const codeToId = new Map<string, string>();
  for (const track of md) {
    for (const module of track.modules)
      for (const lesson of module.lessons) codeToId.set(lesson.code, lesson.id);
  }
  const ids = (codes: string[]) => codes.map((code) => codeToId.get(code) ?? `?${code}`);
  const same = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

  if (md.length !== curriculum.tracks.length) {
    issues.push(
      `CURRICULUM.md has ${md.length} tracks, curriculum.yaml has ${curriculum.tracks.length}`,
    );
  }
  md.forEach((mdTrack, t) => {
    const track = curriculum.tracks[t];
    if (!track) return;
    if (mdTrack.modules.length !== track.modules.length) {
      issues.push(
        `${track.id}: ${mdTrack.modules.length} modules in CURRICULUM.md, ${track.modules.length} in yaml`,
      );
    }
    mdTrack.modules.forEach((mdModule, m) => {
      const module = track.modules[m];
      if (!module) return;
      const where = `${track.id} module ${mdModule.code} (${module.id})`;
      if (mdModule.title !== module.title)
        issues.push(`${where}: title "${mdModule.title}" vs "${module.title}"`);
      if (mdModule.boss !== module.boss) issues.push(`${where}: boss flag differs`);
      const entry = manifest.modules[module.id]?.requires ?? [];
      if (!same(ids(mdModule.entry), entry)) {
        issues.push(
          `${where}: entry ${ids(mdModule.entry).join(', ') || 'none'} vs ${entry.join(', ') || 'none'}`,
        );
      }
      if (!same(ids(mdModule.recommends), module.recommends))
        issues.push(`${where}: recommended differs`);
      const mdIds = mdModule.lessons.map((l) => l.id);
      const yamlIds = module.lessons.map((l) => l.id);
      if (mdIds.join() !== yamlIds.join()) {
        issues.push(`${where}: lessons [${mdIds.join(', ')}] vs [${yamlIds.join(', ')}]`);
        return;
      }
      mdModule.lessons.forEach((mdLesson, i) => {
        const lesson = module.lessons[i];
        if (!lesson) return;
        const at = `${mdLesson.code} ${lesson.id}`;
        if (mdLesson.tier !== lesson.tier)
          issues.push(`${at}: tier ${mdLesson.tier} vs ${lesson.tier}`);
        if (mdLesson.title !== lesson.title)
          issues.push(`${at}: title "${mdLesson.title}" vs "${lesson.title}"`);
        if (mdLesson.minutes !== lesson.minutes)
          issues.push(`${at}: minutes ${mdLesson.minutes} vs ${lesson.minutes}`);
        if (mdLesson.objective !== lesson.objective) issues.push(`${at}: objective differs`);
        if (!same(ids(mdLesson.extraRequires), lesson.requires))
          issues.push(`${at}: extra requires differ`);
        if (!same(ids(mdLesson.recommends), lesson.recommends))
          issues.push(`${at}: recommends differ`);
        const published = manifest.nodes[lesson.id]?.published ?? false;
        if (published !== (mdLesson.status === 'done')) {
          issues.push(
            published
              ? `${at}: published, so its CURRICULUM.md status must be "done" (is "${mdLesson.status}")`
              : `${at}: status is "${mdLesson.status}" but no lesson.yaml is published`,
          );
        }
      });
    });
  });
  return issues;
}
