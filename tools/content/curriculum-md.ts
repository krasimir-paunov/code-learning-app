/**
 * Parses docs/CURRICULUM.md (the human plan) into plain data so content:check can prove
 * that content/curriculum.yaml (the machine source of truth) agrees with it.
 */

export interface MdLesson {
  code: string;
  id: string;
  title: string;
  tier: 'core' | 'extended';
  objective: string;
  /** Extra hard prerequisites written as codes (e.g. "A4.1"), on top of the implicit chain. */
  extraRequires: string[];
  recommends: string[];
  minutes: number;
  status: string;
  visualizer: string;
}

export interface MdModule {
  code: string;
  title: string;
  boss: boolean;
  /** Entry prerequisites as lesson codes; empty for "none". */
  entry: string[];
  recommends: string[];
  lessons: MdLesson[];
}

export interface MdTrack {
  /** Heading as written, e.g. "C\\#" unescaped to "C#". */
  heading: string;
  modules: MdModule[];
}

/** Splits a Markdown table row on unescaped pipes and unescapes `\|`. */
function cells(line: string): string[] {
  const parts = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/);
  return parts.map((cell) => cell.trim().replaceAll('\\|', '|'));
}

const CODE = /[A-Z]+\d+\.\d+/g;

export function parseCurriculumMd(markdown: string): MdTrack[] {
  const tracks: MdTrack[] = [];
  let track: MdTrack | undefined;
  let module: MdModule | undefined;
  let inCurriculum = false;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const h2 = /^## (.+)$/.exec(line);
    if (h2) {
      const heading = (h2[1] ?? '').replaceAll('\\', '');
      inCurriculum = !['Legend', 'Track order and interleaving', 'Visualizer inventory'].includes(
        heading,
      );
      if (inCurriculum) {
        track = { heading, modules: [] };
        tracks.push(track);
      }
      module = undefined;
      continue;
    }
    if (!inCurriculum || !track) continue;

    const h3 = /^### ([A-Z]+\d+) · (.+?) — Entry: (.+)$/.exec(line);
    if (h3) {
      const [, code = '', title = '', rest = ''] = h3;
      const [entryPart = '', recPart = ''] = rest.split(' · Recommended: ');
      module = {
        code,
        title,
        boss: title === 'Boss',
        entry: entryPart.trim() === 'none' ? [] : (entryPart.match(CODE) ?? []),
        recommends: recPart.match(CODE) ?? [],
        lessons: [],
      };
      track.modules.push(module);
      continue;
    }

    if (!module || !line.startsWith('| ') || line.startsWith('| #') || line.startsWith('|---')) {
      continue;
    }
    const [
      code = '',
      id = '',
      title = '',
      tier = '',
      objective = '',
      req = '',
      visual = '',
      ,
      minutes = '',
      status = '',
    ] = cells(line);
    const [hard = '', soft = ''] = req.split('rec ');
    module.lessons.push({
      code,
      id: id.replaceAll('`', ''),
      title,
      tier: tier === 'Core' ? 'core' : 'extended',
      objective,
      extraRequires: hard.match(CODE) ?? [],
      recommends: soft.match(CODE) ?? [],
      minutes: Number(minutes),
      status,
      visualizer: /`([^`]+)`/.exec(visual)?.[1] ?? '',
    });
  }
  return tracks;
}
