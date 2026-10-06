import { useEffect, useState } from 'react';
import { STORAGE_NAMESPACE } from '../../config/app.ts';
import type { NodeStatus } from '../../engine/skilltree/unlock.ts';

const KEY = `${STORAGE_NAMESPACE}.map.seen`;

function readSeen(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Lessons that became completed or unlocked since the map last showed them pulse once.
 * Remembered per tab session; a first visit pulses nothing.
 */
export function useCompletionPulse(ids: readonly string[], statuses: Record<string, NodeStatus>) {
  const [pulse] = useState(() => {
    const seen = readSeen();
    const out = new Set<string>();
    for (const id of ids) {
      const before = seen[id];
      const now = statuses[id]?.state;
      if (!before || before === now) continue;
      if (now === 'completed' || (before === 'locked' && now === 'available')) out.add(id);
    }
    return out;
  });

  useEffect(() => {
    const seen = readSeen();
    for (const id of ids) {
      const state = statuses[id]?.state;
      if (state) seen[id] = state;
    }
    try {
      sessionStorage.setItem(KEY, JSON.stringify(seen));
    } catch {
      // Pulses are decoration; nothing to do without storage.
    }
  }, [ids, statuses]);

  return pulse;
}
