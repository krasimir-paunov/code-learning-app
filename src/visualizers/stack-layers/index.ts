import { defineVisualizer } from '../contract.ts';
import type { StackLayersProps } from './build.ts';

export default defineVisualizer<StackLayersProps>({
  id: 'stack-layers',
  load: () => import('./View.tsx'),
});
