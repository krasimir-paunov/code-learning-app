import { defineVisualizer } from '../contract.ts';
import type { ColorLabProps } from './build.ts';

export default defineVisualizer<ColorLabProps>({
  id: 'color-lab',
  load: () => import('./View.tsx'),
});
