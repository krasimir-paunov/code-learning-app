import { defineVisualizer } from '../contract.ts';
import type { GridPlacerProps } from './build.ts';

export default defineVisualizer<GridPlacerProps>({
  id: 'grid-placer',
  load: () => import('./View.tsx'),
});
