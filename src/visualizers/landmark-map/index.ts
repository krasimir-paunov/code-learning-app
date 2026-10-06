import { defineVisualizer } from '../contract.ts';
import type { LandmarkMapProps } from './build.ts';

export default defineVisualizer<LandmarkMapProps>({
  id: 'landmark-map',
  load: () => import('./View.tsx'),
});
