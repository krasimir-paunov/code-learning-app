import { Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router';
import { sheetIndex } from 'virtual:content/cheatsheets';
import { useDocumentTitle } from '../../app/use-document-title.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { ErrorScreen } from '../../components/ErrorScreen.tsx';
import { Kbd } from '../../components/Kbd.tsx';
import { cx } from '../../components/cx.ts';
import { TerminalLoader } from '../../effects/TerminalLoader.tsx';
import { USAGE, type Usage } from '../../engine/content/cheatsheet-types.ts';
import styles from './CheatSheets.module.css';
import { groupByTrack, matchesUsage } from './search.ts';
import { cachedSheets, loadSheets, type SheetLibrary } from './sheet-data.ts';
import { SheetEntry, UsageBadge } from './SheetEntry.tsx';

const ORDER = sheetIndex.map((s) => s.track);
const titleOf = (track: string) => sheetIndex.find((s) => s.track === track)?.title ?? track;

type Load = { library?: SheetLibrary; error?: boolean };

/** Every sheet is its own chunk; the page waits for all of them because search spans them all. */
export function CheatSheetsPage() {
  const [load, setLoad] = useState<Load>(() => ({ library: cachedSheets() }));

  useEffect(() => {
    if (load.library) return;
    let current = true;
    loadSheets().then(
      (library) => current && setLoad({ library }),
      () => current && setLoad({ error: true }),
    );
    return () => {
      current = false;
    };
  }, [load.library]);

  if (load.error) {
    return (
      <ErrorScreen
        title="The cheat sheets could not load"
        message="You may be offline, or a new version was just published."
      />
    );
  }
  if (!load.library) return <TerminalLoader line="loading cheat sheets" />;
  return <CheatSheets library={load.library} />;
}

/** Cheat sheets: never gated, instant search across every sheet, usage filter, print-friendly. */
function CheatSheets({ library: { sheets, search } }: { library: SheetLibrary }) {
  const { track } = useParams();
  const sheet = track ? sheets.find((s) => s.track === track) : undefined;
  const [query, setQuery] = useState('');
  const [usage, setUsage] = useState<ReadonlySet<Usage>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const searchId = useId();
  useDocumentTitle(sheet ? `${sheet.title} cheat sheet` : 'Cheat sheets');

  // The route renders after the browser's own jump to #entry-id, so honor the hash ourselves.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, [track]);

  // "/" focuses the search box from anywhere on the page (unless typing elsewhere).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== '/' || target.matches('input, textarea, [contenteditable="true"]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleUsage = (u: Usage) =>
    setUsage((current) => {
      const next = new Set(current);
      if (next.has(u)) next.delete(u);
      else next.add(u);
      return next;
    });

  const hits = search.search(query).filter((h) => matchesUsage(h.entry, usage));

  if (track && !sheet) {
    return (
      <EmptyState level={1} title="Cheat sheet not found">
        There is no {track} cheat sheet. <Link to="/cheatsheets">See them all</Link>.
      </EmptyState>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{sheet ? `${sheet.title} cheat sheet` : 'Cheat sheets'}</h1>
        {sheet?.introHtml && (
          <p className={styles.intro} dangerouslySetInnerHTML={{ __html: sheet.introHtml }} />
        )}
        <nav aria-label="Cheat sheets" className={styles.tracks} data-print="hide">
          {sheets.map((s) => (
            <NavLink
              key={s.track}
              to={`/cheatsheets/${s.track}`}
              className={({ isActive }) => cx(styles.trackLink, isActive && styles.trackActive)}
              style={{ ['--track' as string]: `var(--track-${s.track})` }}
            >
              {s.title}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className={styles.toolbar} data-print="hide">
        <div className={styles.searchBox}>
          <label htmlFor={searchId} className="visually-hidden">
            Search all cheat sheets
          </label>
          <Search aria-hidden="true" className={styles.searchIcon} />
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            placeholder="Search all cheat sheets"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className={styles.shortcut} aria-hidden="true">
            <Kbd>/</Kbd>
          </span>
        </div>
        <div role="group" aria-label="Show usage" className={styles.chips}>
          {USAGE.map((u) => (
            <button
              key={u}
              type="button"
              className={styles.chip}
              aria-pressed={usage.has(u)}
              onClick={() => toggleUsage(u)}
            >
              <UsageBadge usage={u} />
            </button>
          ))}
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {query.trim() ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'}` : ''}
      </p>

      {query.trim() ? (
        hits.length === 0 ? (
          <EmptyState title={`Nothing matches “${query}”`}>
            Try a shorter word or a different spelling.
          </EmptyState>
        ) : (
          groupByTrack(hits, ORDER).map(([t, group]) => (
            <section key={t} className={styles.section} aria-labelledby={`results-${t}`}>
              <h2 id={`results-${t}`} className={styles.sectionTitle}>
                {titleOf(t)}
              </h2>
              <div className={styles.entries}>
                {group.map((h) => (
                  <SheetEntry key={h.entry.id} entry={h.entry} />
                ))}
              </div>
            </section>
          ))
        )
      ) : sheet ? (
        sheet.sections.map((section) => {
          const entries = section.entries.filter((e) => matchesUsage(e, usage));
          if (entries.length === 0) return null;
          return (
            <section
              key={section.id}
              className={styles.section}
              aria-labelledby={`section-${section.id}`}
            >
              <h2 id={`section-${section.id}`} className={styles.sectionTitle}>
                {section.title}
              </h2>
              <div className={styles.entries}>
                {entries.map((entry) => (
                  <SheetEntry key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <ul className={styles.index}>
          {sheets.map((s) => {
            const count = s.sections.reduce((n, sec) => n + sec.entries.length, 0);
            return (
              <li key={s.track} style={{ ['--track' as string]: `var(--track-${s.track})` }}>
                <Link to={`/cheatsheets/${s.track}`} className={styles.indexCard}>
                  <span className={styles.indexTitle}>{s.title}</span>
                  <span className={styles.indexMeta}>
                    {count} entries · {s.sections.map((sec) => sec.title).join(', ')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
