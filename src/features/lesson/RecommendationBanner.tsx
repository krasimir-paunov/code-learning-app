import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../../components/Button.tsx';
import { InlineCode } from '../../components/InlineCode.tsx';
import { manifest, trackOf } from '../../engine/content/manifest.ts';
import { useProgress } from '../../engine/progress/store.ts';
import styles from './Lesson.module.css';

interface RecommendationBannerProps {
  trackId: string;
  pending: string[];
  /** Called after skipping, so the page can move focus to the lesson title. */
  onSkipped: () => void;
}

/** Soft gate: one sentence, "Go there", and a one-click skip that applies to the whole track. */
export function RecommendationBanner({ trackId, pending, onSkipped }: RecommendationBannerProps) {
  const skip = useProgress((s) => s.skipRecommendations);
  const track = trackOf(trackId);
  const first = manifest.nodes[pending[0] ?? ''];
  if (!first) return null;
  const firstTrack = trackOf(first.track);

  return (
    <aside className={styles.banner} aria-label="Recommended path">
      <Compass aria-hidden="true" className={styles.bannerIcon} />
      <p>
        The {track?.title ?? ''} track assumes you know some {firstTrack?.title ?? ''} first.
        Recommended first:{' '}
        <Link to={`/learn/${first.id}`}>
          <InlineCode text={first.title} />
        </Link>
        {pending.length > 1 && ` (and ${pending.length - 1} more)`}.
      </p>
      <div className={styles.bannerActions}>
        <Button
          size="sm"
          onClick={() => {
            skip(trackId);
            onSkipped();
          }}
        >
          Skip, I already know this
        </Button>
      </div>
    </aside>
  );
}
