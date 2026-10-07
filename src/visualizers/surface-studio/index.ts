import { defineVisualizer } from '../contract.ts';
import type { SurfaceStudioProps } from './build.ts';

export default defineVisualizer<SurfaceStudioProps>({
  id: 'surface-studio',
  load: () => import('./View.tsx'),
});
