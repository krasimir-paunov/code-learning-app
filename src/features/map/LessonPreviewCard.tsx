import { Clock, Eye, Play, RotateCcw, Star, Swords } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '../../components/Badge.tsx';
import { LinkButton } from '../../components/Button.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { InlineCode } from '../../components/InlineCode.tsx';
import { manifest, trackOf } from '../../engine/content/manifest.ts';
import { STATE_LABELS } from '../../engine/skilltree/summary.ts';
import type { SkillNode } from '../../engine/skilltree/types.ts';
import type { NodeStatus } from '../../engine/skilltree/unlock.ts';
import styles from './LessonPreviewCard.module.css';
import { StateIcon } from './StateIcon.tsx';

interface LessonPreviewCardProps {
  node: SkillNode;
  status: NodeStatus;
  onClose: () => void;
}

function LessonLinks({ ids }: { ids: string[] }) {
  return (
    <ul className={styles.links}>
      {ids.map((id) => {
        const target = manifest.nodes[id];
        return (
          <li key={id}>
            <Link to={`/map/${target?.module ?? ''}`}>
              <InlineCode text={target?.title ?? id} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function LessonPreviewCard({ node, status, onClose }: LessonPreviewCardProps) {
  const track = trackOf(node.track);
  const action = {
    available: { text: 'Start lesson', icon: <Play /> },
    'in-progress': { text: 'Continue', icon: <Play /> },
    completed: { text: 'Review lesson', icon: <RotateCcw /> },
    locked: { text: 'Preview lesson', icon: <Eye /> },
    planned: null,
  }[status.state];

  return (
    <Dialog
      open
      onClose={onClose}
      title={<InlineCode text={node.title} />}
      actions={
        action && (
          <LinkButton
            to={`/learn/${node.id}`}
            variant={status.state === 'locked' ? 'secondary' : 'primary'}
            icon={action.icon}
          >
            {action.text}
          </LinkButton>
        )
      }
    >
      <div className={styles.badges}>
        {track && <Badge>{track.short}</Badge>}
        <Badge tone={node.tier === 'core' ? 'accent' : 'neutral'}>
          {node.tier === 'core' ? 'Core' : 'Depth'}
        </Badge>
        {node.boss && (
          <Badge tone="reward" icon={<Swords />}>
            Boss
          </Badge>
        )}
        <Badge icon={<Clock />}>{node.minutes} min</Badge>
        <Badge
          tone={status.state === 'completed' ? 'success' : 'neutral'}
          icon={<StateIcon state={status.state} />}
        >
          {STATE_LABELS[status.state]}
        </Badge>
      </div>
      <p>
        <InlineCode text={node.objective} />
      </p>
      {node.summary && <p className={styles.muted}>{node.summary}</p>}
      {status.state === 'locked' && status.missing.length > 0 && (
        <div className={styles.note}>
          <p>Complete first:</p>
          <LessonLinks ids={status.missing} />
          <p className={styles.muted}>
            You can still read the concept. Free roam (in your profile) opens everything.
          </p>
        </div>
      )}
      {status.recommendationPending && (
        <div className={styles.note}>
          <p>
            <Star aria-hidden="true" className={styles.star} /> Recommended first (optional):
          </p>
          <LessonLinks ids={status.pendingRecommendations} />
        </div>
      )}
      {status.hasNew && (
        <p className={styles.muted}>This lesson gained new challenges since you finished it.</p>
      )}
    </Dialog>
  );
}
