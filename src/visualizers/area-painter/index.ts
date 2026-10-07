import { defineVisualizer } from '../contract.ts';
import type { AreaPainterProps } from './build.ts';

export default defineVisualizer<AreaPainterProps>({
  id: 'area-painter',
  load: () => import('./View.tsx'),
});
