import { useState } from 'react';
import { useDocumentTitle } from '../../app/use-document-title.ts';
import { Button } from '../../components/Button.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import { Toggle } from '../../components/Toggle.tsx';
import { trackOf } from '../../engine/content/manifest.ts';
import { toLocalDate } from '../../engine/progress/dates.ts';
import { summarize } from '../../engine/progress/derive.ts';
import type { Settings } from '../../engine/progress/schema.ts';
import { useProgress } from '../../engine/progress/store.ts';
import { levelProgress } from '../../engine/progress/xp.ts';
import { ActivityCalendar } from './ActivityCalendar.tsx';
import { BackupPanel } from './BackupPanel.tsx';
import styles from './ProfilePage.module.css';

const EFFECTS: { value: Settings['effects']; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'full', label: 'Full' },
  { value: 'reduced', label: 'Reduced' },
  { value: 'off', label: 'Off' },
];

export function ProfilePage() {
  useDocumentTitle('Profile');
  const progress = useProgress((s) => s.progress);
  const updateSettings = useProgress((s) => s.updateSettings);
  const restoreRecommendations = useProgress((s) => s.restoreRecommendations);
  const resetProgress = useProgress((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);
  const today = toLocalDate(new Date());
  const stats = summarize(progress, today);
  const level = levelProgress(stats.xp);
  const { settings } = progress;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <section aria-labelledby="stats-title" className={styles.section}>
        <h2 id="stats-title" className={styles.heading}>
          Stats
        </h2>
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Level</dt>
            <dd className={styles.reward}>{level.level}</dd>
            <dd className={styles.statNote}>
              {level.into} / {level.span} XP to level {level.level + 1}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Total XP</dt>
            <dd>{stats.xp.toLocaleString('en')}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Current streak</dt>
            <dd>
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Longest streak</dt>
            <dd>
              {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Lessons completed</dt>
            <dd>{stats.lessonsCompleted}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Challenges passed</dt>
            <dd>{stats.challengesPassed}</dd>
          </div>
        </dl>
        <h3 className={styles.subheading}>Activity</h3>
        <ActivityCalendar activity={progress.activity} today={today} />
      </section>

      <section aria-labelledby="settings-title" className={styles.section}>
        <h2 id="settings-title" className={styles.heading}>
          Settings
        </h2>
        <div className={styles.stack}>
          <div className={styles.stack}>
            <SegmentedControl
              label="Visual effects"
              options={EFFECTS}
              value={settings.effects}
              onChange={(effects) => updateSettings({ effects })}
            />
            <p className={styles.muted}>
              System follows your device&apos;s reduced-motion setting. Reduced keeps short fades
              only; Off removes all animation. Lessons and code are always still.
            </p>
          </div>
          <Toggle
            label="Free roam"
            checked={settings.freeRoam}
            onChange={(freeRoam) => updateSettings({ freeRoam })}
            description="Open every published lesson regardless of prerequisites and hide recommendation banners. Progress still tracks normally."
          />
          <SegmentedControl
            label="Code examples open in"
            options={[
              { value: 'js', label: 'JavaScript' },
              { value: 'cs', label: 'C#' },
            ]}
            value={settings.preferredCodeTab}
            onChange={(preferredCodeTab) => updateSettings({ preferredCodeTab })}
          />
          <div className={styles.narrow}>
            <Slider
              label="Editor font size"
              min={12}
              max={24}
              value={settings.editorFontSize}
              onChange={(editorFontSize) => updateSettings({ editorFontSize })}
              format={(v) => `${v}px`}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="recs-title" className={styles.section}>
        <h2 id="recs-title" className={styles.heading}>
          Recommended path
        </h2>
        {progress.skippedRecommendations.length === 0 ? (
          <p className={styles.muted}>
            You have not skipped any recommendations. Tracks that build on others show a
            &ldquo;Recommended path&rdquo; banner you can skip in one click.
          </p>
        ) : (
          <ul className={styles.list}>
            {progress.skippedRecommendations.map((track) => (
              <li key={track}>
                <span>
                  Skipped for <strong>{trackOf(track)?.title ?? track}</strong>
                </span>
                <Button size="sm" onClick={() => restoreRecommendations(track)}>
                  Show recommendations again
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="backup-title" className={styles.section} id="backup">
        <h2 id="backup-title" className={styles.heading}>
          Backup
        </h2>
        <BackupPanel />
      </section>

      <section aria-labelledby="reset-title" className={styles.section}>
        <h2 id="reset-title" className={styles.heading}>
          Start over
        </h2>
        <p className={styles.muted}>
          Clears lessons, XP and streaks in this browser. Settings stay.
        </p>
        <div>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Reset progress
          </Button>
        </div>
        <Dialog
          open={confirmReset}
          onClose={() => setConfirmReset(false)}
          title="Reset all progress?"
          actions={
            <>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                }}
              >
                Reset progress
              </Button>
            </>
          }
        >
          <p>
            This removes {stats.lessonsCompleted} completed lessons and {stats.xp} XP from this
            browser. It cannot be undone unless you exported a backup.
          </p>
        </Dialog>
      </section>
    </div>
  );
}
