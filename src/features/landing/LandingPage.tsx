import { BookOpen, Pause, Play, Rocket } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { useDocumentTitle } from '../../app/use-document-title.ts';
import { Button, LinkButton } from '../../components/Button.tsx';
import { REPO_URL } from '../../config/app.ts';
import { DigitalRain } from '../../effects/DigitalRain.tsx';
import { useMotionPreference } from '../../effects/motion.ts';
import { FlexDemo } from './FlexDemo.tsx';
import styles from './LandingPage.module.css';

// Loaded only when the landing page renders below the fold; it is not part of the hero.
const SortRaceDemo = lazy(async () => ({
  default: (await import('./SortRaceDemo.tsx')).SortRaceDemo,
}));

const ANATOMY = [
  ['Concept', 'One mental model, readable in under a minute.'],
  ['Playground', 'Drag, toggle and step through it until it clicks.'],
  ['Challenges', 'Predict, fix, reorder, trace or write code. Checked instantly.'],
  ['In production', 'Where you will meet it at work, and the library to call.'],
  ['Common mistake', 'The bug everyone writes once, and its fix.'],
  ['Recap', 'Two or three lines to keep.'],
] as const;

const TRACKS = [
  ['html', 'HTML', 'Semantic, accessible structure from the first tag.'],
  ['css', 'CSS', 'The cascade, the box model, Flexbox, Grid and modern responsive design.'],
  ['js', 'JavaScript', 'Programming fundamentals, the DOM, async and TypeScript.'],
  ['algo', 'Algorithms', 'Big O by counting, sorting races, trees, graphs and hashing.'],
  ['cs', 'C#', 'Static types, memory, OOP, LINQ and async in C# 14.'],
  ['net', '.NET', 'ASP.NET Core and EF Core on .NET 10, through simulators.'],
] as const;

export function LandingPage() {
  useDocumentTitle(undefined);
  const level = useMotionPreference();
  const [paused, setPaused] = useState(false);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <DigitalRain paused={paused} />
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>HTML · CSS · JavaScript · Algorithms · C# · .NET</p>
          <h1 id="hero-title" className={styles.title}>
            Learn code by running it.
          </h1>
          <p className={styles.lead}>
            Every lesson starts with something to touch, not a wall of text. Each concept clicks
            within 30 seconds, and every answer is checked by running real code.
          </p>
          <div className={styles.actions}>
            <LinkButton to="/map" variant="primary" icon={<Rocket />}>
              Start learning
            </LinkButton>
            <LinkButton to="/cheatsheets" icon={<BookOpen />}>
              Cheat sheets
            </LinkButton>
          </div>
        </div>
        {level === 'full' && (
          <Button
            variant="ghost"
            size="sm"
            className={styles.pause}
            aria-pressed={paused}
            icon={paused ? <Play /> : <Pause />}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'Play background' : 'Pause background'}
          </Button>
        )}
      </section>

      <section className={styles.section} aria-labelledby="try-title">
        <h2 id="try-title" className={styles.sectionTitle}>
          Show, don&apos;t tell
        </h2>
        <p className={styles.sectionLead}>
          This is how lessons feel. Change the value and watch the layout answer.
        </p>
        <FlexDemo />
      </section>

      <section className={styles.section} aria-labelledby="race-title">
        <h2 id="race-title" className={styles.sectionTitle}>
          Watch algorithms race
        </h2>
        <p className={styles.sectionLead}>
          Three sorts on the same bars, counting every comparison, swap and write. In the Algorithms
          track you choose the algorithms, the size and the speed, and step through every move.
        </p>
        <Suspense fallback={null}>
          <SortRaceDemo />
        </Suspense>
      </section>

      <section className={styles.section} aria-labelledby="anatomy-title">
        <h2 id="anatomy-title" className={styles.sectionTitle}>
          Every lesson, the same six steps
        </h2>
        <ol className={styles.anatomy}>
          {ANATOMY.map(([name, text]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="tracks-title">
        <h2 id="tracks-title" className={styles.sectionTitle}>
          Six tracks, one map
        </h2>
        <ul className={styles.tracks}>
          {TRACKS.map(([id, name, text]) => (
            <li
              key={id}
              className={styles.track}
              style={{ ['--track' as string]: `var(--track-${id})` }}
            >
              <h3>{name}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <LinkButton to="/map" variant="primary">
            Open the skill map
          </LinkButton>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Your progress stays in this browser. Nothing is sent anywhere; export a backup any time.
        </p>
        <p>
          <a href={REPO_URL}>Source code on GitHub</a>
        </p>
      </footer>
    </div>
  );
}
