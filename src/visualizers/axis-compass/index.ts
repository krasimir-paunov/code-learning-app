import { defineVisualizer } from '../contract.ts';
import type { AxisCompassProps } from './build.ts';

export default defineVisualizer<AxisCompassProps>({
  id: 'axis-compass',
  load: () => import('./View.tsx'),
});
