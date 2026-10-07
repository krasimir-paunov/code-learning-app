import { defineVisualizer } from '../contract.ts';
import type { LoadWaterfallProps } from './build.ts';

export default defineVisualizer<LoadWaterfallProps>({
  id: 'load-waterfall',
  load: () => import('./View.tsx'),
});
