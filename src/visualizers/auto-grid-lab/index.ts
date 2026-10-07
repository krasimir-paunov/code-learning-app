import { defineVisualizer } from '../contract.ts';
import type { AutoGridLabProps } from './build.ts';

export default defineVisualizer<AutoGridLabProps>({
  id: 'auto-grid-lab',
  load: () => import('./View.tsx'),
});
