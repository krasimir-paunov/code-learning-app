import { defineVisualizer } from '../contract.ts';
import type { ListShaperProps } from './build.ts';

export default defineVisualizer<ListShaperProps>({
  id: 'list-shaper',
  load: () => import('./View.tsx'),
});
