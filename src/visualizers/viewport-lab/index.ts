import { defineVisualizer } from '../contract.ts';
import type { ViewportLabProps } from './build.ts';

export default defineVisualizer<ViewportLabProps>({
  id: 'viewport-lab',
  load: () => import('./View.tsx'),
});
