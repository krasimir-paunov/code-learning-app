import { CircleCheck, Eye, Lightbulb, Lock } from 'lucide-react';
import { Suspense, useId, useState } from 'react';
import { Badge } from '../../components/Badge.tsx';
import { Button } from '../../components/Button.tsx';
import { InlineCode } from '../../components/InlineCode.tsx';
import { TerminalLoader } from '../../effects/TerminalLoader.tsx';
import type { GradeResult } from '../../engine/challenges/contract.ts';
import { challengeTypes, challengeViews } from '../../engine/challenges/registry.ts';
import type { CompiledChallenge } from '../../engine/content/lesson-types.ts';
import type { LessonRef } from '../../engine/progress/actions.ts';
import { useProgress } from '../../engine/progress/store.ts';
import { runners } from '../../engine/runners/registry.ts';
import styles from './Lesson.module.css';

interface ChallengeShellProps {
  challenge: CompiledChallenge;
  index: number;
  total: number;
  lesson: LessonRef;
  /** Locked lessons show challenges read-only. */
  disabled: boolean;
}

/**
 * Everything around a challenge view: prompt, attempts, progressive hints (each costs XP),
 * reveal (0 XP, the learner still submits once), and specific feedback, announced politely.
 */
export function ChallengeShell({ challenge, index, total, lesson, disabled }: ChallengeShellProps) {
  const runtime = challengeTypes[challenge.type];
  const View = challengeViews[challenge.type];
  const record = useProgress((s) => s.progress.lessons[lesson.id]?.challenges[challenge.id]);
  const recordPass = useProgress((s) => s.recordPass);
  const recordFailedAttempt = useProgress((s) => s.recordFailedAttempt);
  const recordHint = useProgress((s) => s.recordHint);
  const recordReveal = useProgress((s) => s.recordReveal);
  const [lastResult, setLastResult] = useState<GradeResult>();
  const [awarded, setAwarded] = useState<number | null>(null);
  const headingId = useId();

  const passed = record?.passedAt !== undefined;
  const hintsUsed = record?.hintsUsed ?? 0;
  const revealed = record?.revealed ?? false;
  const attempts = record?.attempts ?? 0;

  if (!runtime || !View) return <p>Unknown challenge type “{challenge.type}”.</p>;
  const grader = runtime;

  async function submit(answer: unknown): Promise<GradeResult> {
    const result = await grader.grade(challenge.spec, answer, { runners });
    setLastResult(result);
    if (result.passed) {
      const pass = recordPass(lesson, challenge.id, challenge.xp);
      if (!passed) setAwarded(pass.challengeXp);
    } else if (!result.partial) {
      recordFailedAttempt(lesson, challenge.id);
    }
    return result;
  }

  const succeeded = passed && (lastResult?.passed ?? true);

  return (
    <article
      className={styles.challenge}
      aria-labelledby={headingId}
      data-passed={passed || undefined}
      id={`challenge-${challenge.id}`}
    >
      <header className={styles.challengeHeader}>
        <h3 id={headingId} className={styles.challengeTitle}>
          Challenge {index + 1} of {total}
          <span className={styles.challengeType}>{runtime.label}</span>
        </h3>
        <div className={styles.badges}>
          {passed ? (
            <Badge tone="success" icon={<CircleCheck />}>
              Passed{record?.xp ? ` · +${record.xp} XP` : ''}
            </Badge>
          ) : (
            <Badge tone="reward">{challenge.xp} XP</Badge>
          )}
          {attempts > 0 && !passed && (
            <Badge>
              {attempts} {attempts === 1 ? 'try' : 'tries'}
            </Badge>
          )}
        </div>
      </header>

      <div
        className={`prose ${styles.prompt}`}
        dangerouslySetInnerHTML={{ __html: challenge.promptHtml }}
      />

      {disabled && (
        <p className={styles.lockedNote}>
          <Lock aria-hidden="true" /> Complete the prerequisites to answer this challenge.
        </p>
      )}

      <Suspense fallback={<TerminalLoader line={`loading ${challenge.type}`} />}>
        <View
          id={challenge.id}
          spec={challenge.spec}
          disabled={disabled}
          submit={submit}
          state={{ attempts, hintsUsed, revealed, passed, lastResult }}
        />
      </Suspense>

      <div className={styles.feedback} aria-live="polite">
        {lastResult && (
          <div
            className={styles.feedbackBody}
            data-tone={lastResult.passed ? 'success' : lastResult.partial ? 'info' : 'danger'}
          >
            <p>
              <strong>
                {lastResult.passed ? 'Correct. ' : lastResult.partial ? '' : 'Not yet. '}
              </strong>
              <InlineCode text={lastResult.feedback} />
              {lastResult.passed && awarded !== null && (
                <span className={styles.xpGain}> +{awarded} XP</span>
              )}
            </p>
          </div>
        )}
        {succeeded && (
          <div className={`prose ${styles.explanation}`}>
            <p className={styles.explanationLabel}>Why</p>
            <div dangerouslySetInnerHTML={{ __html: challenge.explanationHtml }} />
          </div>
        )}
      </div>

      {(challenge.hintsHtml.length > 0 || !passed) && !disabled && (
        <div className={styles.help}>
          {hintsUsed > 0 && (
            <ol className={styles.hints} aria-label="Hints">
              {challenge.hintsHtml.slice(0, hintsUsed).map((hint, i) => (
                <li key={i} className="prose" dangerouslySetInnerHTML={{ __html: hint }} />
              ))}
            </ol>
          )}
          {!passed && (
            <div className={styles.helpActions}>
              {hintsUsed < challenge.hintsHtml.length && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Lightbulb />}
                  onClick={() => recordHint(lesson, challenge.id)}
                >
                  Hint {hintsUsed + 1} of {challenge.hintsHtml.length} (−25% XP)
                </Button>
              )}
              {!revealed && attempts > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Eye />}
                  onClick={() => recordReveal(lesson, challenge.id)}
                >
                  Show the solution (0 XP)
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {revealed && !passed && (
        <div className={styles.solution}>
          <p className={styles.explanationLabel}>Solution: enter it yourself to finish</p>
          <div className="prose" dangerouslySetInnerHTML={{ __html: challenge.solutionHtml }} />
        </div>
      )}
    </article>
  );
}
