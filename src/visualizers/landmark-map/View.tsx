import { CircleAlert } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import type { LandmarkMapProps } from './build.ts';
import {
  allRegions,
  analyze,
  pageIssues,
  REGION_TAGS,
  toHtml,
  type Choices,
  type Region,
  type RegionResult,
  type RegionTag,
} from './model.ts';
import styles from './View.module.css';

const LANDMARK_NAME: Record<string, string> = {
  banner: 'banner (the site header)',
  navigation: 'navigation',
  main: 'main',
  complementary: 'complementary (related content)',
  contentinfo: 'content info (the site footer)',
  region: 'region',
  search: 'search',
  form: 'form',
};

function roleText(result: RegionResult): string {
  if (result.landmark) return `${LANDMARK_NAME[result.role] ?? result.role} landmark`;
  if (result.role === 'article') return 'article (not a landmark)';
  if (result.tag === 'header' || result.tag === 'footer')
    return 'not a landmark inside <article>, <aside>, <main>, <nav> or <section>';
  if (result.tag === 'section') return 'not a landmark: a section needs a name';
  return 'no role';
}

function Block({
  region,
  results,
  onApply,
  tool,
}: {
  region: Region;
  results: Map<string, RegionResult>;
  onApply: (id: string) => void;
  tool: RegionTag;
}) {
  const result = results.get(region.id);
  if (!result) return null;
  return (
    <div
      className={styles.block}
      data-landmark={result.landmark || undefined}
      data-side={region.side || undefined}
    >
      <button
        type="button"
        className={styles.blockButton}
        onClick={() => onApply(region.id)}
        aria-label={`${region.label}: now <${result.tag}>. Apply <${tool}>.`}
      >
        <span className={styles.tag}>&lt;{result.tag}&gt;</span>
        <span className={styles.label}>{region.label}</span>
        <span className={styles.role}>{roleText(result)}</span>
      </button>
      {region.children?.length ? (
        <div className={styles.children}>
          {region.children.map((child) => (
            <Block key={child.id} region={child} results={results} onApply={onApply} tool={tool} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function LandmarkMapView({ props }: VisualizerViewProps<LandmarkMapProps>) {
  const [tool, setTool] = useState<RegionTag>('header');
  const [choices, setChoices] = useState<Choices>({});
  const [status, setStatus] = useState('');
  const results = analyze(props.regions, choices);
  const byId = new Map(results.map((r) => [r.id, r]));
  const landmarks = results.filter((r) => r.landmark);
  const fitting = results.filter((r) => r.fits).length;
  const issues = pageIssues(results);
  const total = allRegions(props.regions).length;

  const apply = (id: string) => {
    setChoices((c) => ({ ...c, [id]: tool }));
    const region = allRegions(props.regions).find((r) => r.id === id);
    setStatus(`${region?.label ?? ''} is now <${tool}>.`);
  };

  return (
    <div className={styles.frame}>
      <SegmentedControl
        label="Element to apply"
        size="sm"
        options={REGION_TAGS.map((tag) => ({ value: tag, label: `<${tag}>` }))}
        value={tool}
        onChange={setTool}
      />
      <div className={styles.lab}>
        <div
          className={styles.page}
          role="group"
          aria-label="Page wireframe: click a block to apply the element"
        >
          {props.regions.map((region) => (
            <Block key={region.id} region={region} results={byId} onApply={apply} tool={tool} />
          ))}
        </div>

        <aside className={styles.panel} aria-label="Landmarks">
          <h3 className={styles.panelTitle}>Landmarks a screen reader lists</h3>
          {landmarks.length === 0 ? (
            <p className={styles.muted}>None yet: the page is a pile of divs.</p>
          ) : (
            <ol className={styles.landmarks}>
              {landmarks.map((l) => (
                <li key={l.id}>
                  <strong>{LANDMARK_NAME[l.role] ?? l.role}</strong>
                  <span className={styles.muted}> {l.label}</span>
                </li>
              ))}
            </ol>
          )}
          {issues.map((issue) => (
            <p key={issue} className={styles.issue}>
              <CircleAlert aria-hidden="true" /> {issue}
            </p>
          ))}
          <p className={styles.score}>
            {fitting} of {total} blocks use an element that fits their purpose.
          </p>
          <details className={styles.markup}>
            <summary>Markup</summary>
            <pre>
              <code>{toHtml(props.regions, choices, { annotate: false })}</code>
            </pre>
          </details>
          <p className="visually-hidden" aria-live="polite">
            {status}
          </p>
        </aside>
      </div>
    </div>
  );
}
