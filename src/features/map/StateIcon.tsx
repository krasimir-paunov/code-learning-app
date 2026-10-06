import { Check, CircleDashed, CircleDot, Lock, Play } from 'lucide-react';
import type { NodeState } from '../../engine/skilltree/unlock.ts';

const ICONS = {
  planned: CircleDashed,
  locked: Lock,
  available: Play,
  'in-progress': CircleDot,
  completed: Check,
} satisfies Record<NodeState, unknown>;

/** Decorative: every use sits next to the state's text label. */
export function StateIcon({ state, className }: { state: NodeState; className?: string }) {
  const Icon = ICONS[state];
  return <Icon aria-hidden="true" className={className} />;
}
