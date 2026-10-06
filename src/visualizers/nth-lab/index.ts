import { defineVisualizer } from '../contract.ts';
import type { NthLabProps } from './build.ts';

export default defineVisualizer<NthLabProps>({
  id: 'nth-lab',
  load: () => import('./View.tsx'),
});
