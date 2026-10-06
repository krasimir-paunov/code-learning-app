import { Clock, Lock, Maximize, RotateCcw, Swords } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/Badge.tsx';
import { CodeBlock } from '../../components/CodeBlock.tsx';
import { IconButton } from '../../components/IconButton.tsx';
import { InlineCode } from '../../components/InlineCode.tsx';
import { TerminalLoader } from '../../effects/TerminalLoader.tsx';
import { manifest, trackOf, useNodeStatuses } from '../../engine/content/manifest.ts';
import type { CompiledLesson } from '../../engine/content/lesson-types.ts';
import type { LessonRef } from '../../engine/progress/actions.ts';
import { useProgress } from '../../engine/progress/store.ts';
import type { SkillNode } from '../../engine/skilltree/types.ts';
import { nextLesson } from '../../engine/skilltree/unlock.ts';
import { visualizerViews } from '../../visualizers/registry.ts';
import { ChallengeShell } from './ChallengeShell.tsx';
import styles from './Lesson.module.css';
import { LessonCompleteCard } from './LessonCompleteCard.tsx';
import { RecommendationBanner } from './RecommendationBanner.tsx';
import { SectionRail } from './SectionRail.tsx';

interface LessonPlayerProps {
  lesson: CompiledLesson;
  node: SkillNode;
}

function Playground({ lesson }: { lesson: CompiledLesson }) {
  const frame = useRef<HTMLDivElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const View = visualizerViews[lesson.playground.visualizer];
  return (
    <div ref={frame} className={styles.playground}>
      <div className={styles.playgroundBar}>
        <div
          className={`prose ${styles.playgroundPrompt}`}
          dangerouslySetInnerHTML={{ __html: lesson.playground.promptHtml }}
        />
        <div className={styles.playgroundActions}>
          <IconButton
            label="Reset the playground"
            icon={<RotateCcw />}
            onClick={() => setResetKey((k) => k + 1)}
          />
          <IconButton
            label="Full screen"
            icon={<Maximize />}
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void frame.current?.requestFullscreen?.();
            }}
          />
        </div>
      </div>
      {View ? (
        <Suspense fallback={<TerminalLoader line={`loading ${lesson.playground.visualizer}`} />}>
          <View
            key={resetKey}
            props={lesson.playground.props}
            title={`Playground for ${lesson.title}`}
          />
        </Suspense>
      ) : (
        <p>Unknown visualizer “{lesson.playground.visualizer}”.</p>
      )}
      {lesson.playground.exploreHtml.length > 0 && (
        <div className={styles.explore}>
          <p className={styles.explanationLabel}>Then try</p>
          <ul>
            {lesson.playground.exploreHtml.map((html, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The fixed six-part anatomy: concept, playground, challenges, in production, mistake, recap. */
export function LessonPlayer({ lesson, node }: LessonPlayerProps) {
  const statuses = useNodeStatuses();
  const status = statuses[node.id];
  const startLesson = useProgress((s) => s.startLesson);
  const preferredLang = useProgress((s) => s.progress.settings.preferredCodeTab);
  const record = useProgress((s) => s.progress.lessons[node.id]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const track = trackOf(node.track);
  const locked = status?.state === 'locked';
  const ref: LessonRef = {
    id: lesson.id,
    version: lesson.version,
    challengeIds: lesson.challenges.map((c) => c.id),
    boss: node.boss,
  };

  useEffect(() => {
    if (!locked)
      startLesson({ id: lesson.id, version: lesson.version, challengeIds: [], boss: node.boss });
  }, [locked, lesson.id, lesson.version, node.boss, startLesson]);

  const passed = lesson.challenges.filter((c) => record?.challenges[c.id]?.passedAt).length;
  const lessonXp =
    (record?.completionXp ?? 0) +
    Object.values(record?.challenges ?? {}).reduce((sum, c) => sum + c.xp, 0);
  const next = nextLesson(manifest, statuses, node.id);
  const nextNode = next ? manifest.nodes[next] : undefined;

  return (
    <div className={styles.layout}>
      <SectionRail passed={passed} total={lesson.challenges.length} />
      <div className={styles.main}>
        <header className={styles.header}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link
              to={`/map/${node.module}`}
              style={{ color: `var(--${track?.color ?? 'text-2'})` }}
            >
              {track?.title} · {manifest.modules[node.module]?.title}
            </Link>
          </nav>
          <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
            <InlineCode text={lesson.title} />
          </h1>
          <p className={styles.summary}>{lesson.summary}</p>
          <div className={styles.badges}>
            <Badge icon={<Clock />}>{lesson.minutes} min</Badge>
            <Badge tone={node.tier === 'core' ? 'accent' : 'neutral'}>
              {node.tier === 'core' ? 'Core' : 'Depth'}
            </Badge>
            {node.boss && (
              <Badge tone="reward" icon={<Swords />}>
                Boss
              </Badge>
            )}
          </div>
        </header>

        {status?.recommendationPending && (
          <RecommendationBanner
            trackId={node.track}
            pending={status.pendingRecommendations}
            onSkipped={() => titleRef.current?.focus()}
          />
        )}
        {locked && status && (
          <aside className={styles.lockedBanner} aria-label="Locked">
            <Lock aria-hidden="true" />
            <p>
              This lesson is locked. You can read it, but challenges open after{' '}
              {status.missing.map((id, i) => (
                <span key={id}>
                  {i > 0 && ', '}
                  <Link to={`/learn/${id}`}>
                    <InlineCode text={manifest.nodes[id]?.title ?? id} />
                  </Link>
                </span>
              ))}
              . Free roam in your <Link to="/profile">profile</Link> opens everything.
            </p>
          </aside>
        )}

        <section id="concept" aria-labelledby="concept-title" className={styles.section}>
          <h2 id="concept-title" className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>Concept</span>
            <InlineCode text={lesson.concept.title} />
          </h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: lesson.concept.html }} />
          {lesson.concept.code && (
            <CodeBlock block={lesson.concept.code} preferredLang={preferredLang} />
          )}
        </section>

        <section
          id="playground"
          aria-labelledby="playground-title"
          className={`${styles.section} ${styles.wide}`}
        >
          <h2 id="playground-title" className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>Playground</span>
            Try it
          </h2>
          <Playground lesson={lesson} />
        </section>

        <section
          id="challenges"
          aria-labelledby="challenges-title"
          className={`${styles.section} ${styles.wide}`}
        >
          <h2 id="challenges-title" className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>Challenges</span>
            Prove it ({passed} of {lesson.challenges.length} passed)
          </h2>
          {lesson.challenges.map((challenge, i) => (
            <ChallengeShell
              key={challenge.id}
              challenge={challenge}
              index={i}
              total={lesson.challenges.length}
              lesson={ref}
              disabled={locked}
            />
          ))}
          {record?.completedAt && <LessonCompleteCard xp={lessonXp} next={nextNode} />}
        </section>

        <section id="production" aria-labelledby="production-title" className={styles.section}>
          <h2 id="production-title" className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>In production</span>
            Where you will meet it
          </h2>
          {lesson.production.map((item) => (
            <div key={item.title} className={styles.callout} data-kind="production">
              <h3 className={styles.calloutTitle}>
                <InlineCode text={item.title} />
              </h3>
              <div className="prose" dangerouslySetInnerHTML={{ __html: item.html }} />
              {item.code && <CodeBlock block={item.code} preferredLang={preferredLang} />}
            </div>
          ))}
        </section>

        <section id="mistake" aria-labelledby="mistake-title" className={styles.section}>
          <h2 id="mistake-title" className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>Common mistake</span>
            <InlineCode text={lesson.mistake.title} />
          </h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: lesson.mistake.html }} />
          <div className={styles.mistakeGrid}>
            {lesson.mistake.bad && (
              <div className={styles.callout} data-kind="bad">
                <p className={styles.explanationLabel}>The bug</p>
                <CodeBlock block={lesson.mistake.bad} preferredLang={preferredLang} />
              </div>
            )}
            <div className={styles.callout} data-kind="fix">
              <p className={styles.explanationLabel}>The fix</p>
              <div className="prose" dangerouslySetInnerHTML={{ __html: lesson.mistake.fixHtml }} />
              {lesson.mistake.good && (
                <CodeBlock block={lesson.mistake.good} preferredLang={preferredLang} />
              )}
            </div>
          </div>
        </section>

        <section id="recap" aria-labelledby="recap-title" className={styles.section}>
          <h2 id="recap-title" className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>Recap</span>
            Keep these
          </h2>
          <ul className={styles.recap}>
            {lesson.recapHtml.map((html, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
