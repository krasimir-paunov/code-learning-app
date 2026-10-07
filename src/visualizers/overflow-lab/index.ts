import { defineVisualizer } from '../contract.ts';
import type { OverflowLabProps } from './build.ts';

export default defineVisualizer<OverflowLabProps>({
  id: 'overflow-lab',
  load: () => import('./View.tsx'),
});
