import { defineVisualizer } from '../contract.ts';
import type { SelectorLabProps } from './build.ts';

export default defineVisualizer<SelectorLabProps>({
  id: 'selector-lab',
  load: () => import('./View.tsx'),
});
