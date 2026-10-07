import { defineVisualizer } from '../contract.ts';
import type { PositionLabProps } from './build.ts';

export default defineVisualizer<PositionLabProps>({
  id: 'position-lab',
  load: () => import('./View.tsx'),
});
