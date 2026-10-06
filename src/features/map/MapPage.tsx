import { LayoutGrid, List } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '../../app/use-document-title.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { LinkButton } from '../../components/Button.tsx';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { useMediaQuery } from '../../components/use-media-query.ts';
import { manifest, trackOf, useNodeStatuses } from '../../engine/content/manifest.ts';
import type { TierFilter } from '../../engine/skilltree/summary.ts';
import { MapLegend } from './MapLegend.tsx';
import { MapListView } from './MapListView.tsx';
import { MapOverview } from './MapOverview.tsx';
import styles from './MapPage.module.css';
import { ModuleView } from './ModuleView.tsx';

type View = 'map' | 'list';

export function MapPage() {
  const { moduleId } = useParams();
  const [params, setParams] = useSearchParams();
  // The list view is the default on narrow screens (and always one click away).
  const narrow = useMediaQuery('(max-width: 767px)');
  const view: View = (params.get('view') as View | null) ?? (narrow ? 'list' : 'map');
  const tier: TierFilter = params.get('tier') === 'core' ? 'core' : 'all';
  const statuses = useNodeStatuses();
  const module = moduleId ? manifest.modules[moduleId] : undefined;
  const track = module ? trackOf(module.track) : undefined;
  useDocumentTitle(module ? `${module.title} · Skill map` : 'Skill map');

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  if (moduleId && !module) {
    return (
      <EmptyState
        level={1}
        title="Module not found"
        actions={<LinkButton to="/map">Back to the map</LinkButton>}
      >
        There is no module called “{moduleId}”.
      </EmptyState>
    );
  }

  const published = Object.values(manifest.nodes).filter((n) => n.published).length;
  const total = manifest.order.length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titles}>
          {module && track ? (
            <>
              <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
                <Link to={{ pathname: '/map', search: params.toString() }}>Skill map</Link>
                <span aria-hidden="true">/</span>
                <span style={{ color: `var(--${track.color})` }}>{track.title}</span>
              </nav>
              <h1 className={styles.title}>{module.title}</h1>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Skill map</h1>
              <p className={styles.subtitle}>
                {total} lessons across {manifest.tracks.length} tracks. {published} playable now;
                the rest are on the way.
              </p>
            </>
          )}
        </div>
        <div className={styles.controls}>
          <SegmentedControl<View>
            label="View"
            hideLabel
            size="sm"
            options={[
              {
                value: 'map',
                label: (
                  <>
                    <LayoutGrid aria-hidden="true" size={14} /> Map
                  </>
                ),
              },
              {
                value: 'list',
                label: (
                  <>
                    <List aria-hidden="true" size={14} /> List
                  </>
                ),
              },
            ]}
            value={view}
            onChange={(v) => setParam('view', v)}
          />
          <SegmentedControl<TierFilter>
            label="Show"
            hideLabel
            size="sm"
            options={[
              { value: 'all', label: 'All lessons' },
              { value: 'core', label: 'Core only' },
            ]}
            value={tier}
            onChange={(t) => setParam('tier', t === 'core' ? 'core' : null)}
          />
        </div>
      </header>

      {view === 'list' ? (
        <MapListView tier={tier} statuses={statuses} focusModule={module?.id} />
      ) : module ? (
        <ModuleView module={module} tier={tier} statuses={statuses} />
      ) : (
        <MapOverview tier={tier} statuses={statuses} search={params.toString()} />
      )}

      <MapLegend />
    </div>
  );
}
