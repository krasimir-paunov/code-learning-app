import { defineVisualizer } from '../contract.ts';
import type { SizingLabProps } from './build.ts';

export default defineVisualizer<SizingLabProps>({
  id: 'sizing-lab',
  load: () => import('./View.tsx'),
});
