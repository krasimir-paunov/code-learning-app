import { defineVisualizer } from '../contract.ts';
import type { PatternLabProps } from './build.ts';

export default defineVisualizer<PatternLabProps>({
  id: 'pattern-lab',
  load: () => import('./View.tsx'),
});
