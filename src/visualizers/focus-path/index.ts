import { defineVisualizer } from '../contract.ts';
import type { FocusPathProps } from './build.ts';

export default defineVisualizer<FocusPathProps>({
  id: 'focus-path',
  load: () => import('./View.tsx'),
});
