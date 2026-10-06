import { defineVisualizer } from '../contract.ts';
import type { OutlineViewProps } from './build.ts';

export default defineVisualizer<OutlineViewProps>({
  id: 'outline-view',
  load: () => import('./View.tsx'),
});
