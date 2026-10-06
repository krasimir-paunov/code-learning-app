import { defineVisualizer } from '../contract.ts';
import type { DomTreeProps } from './build.ts';

export default defineVisualizer<DomTreeProps>({
  id: 'dom-tree',
  load: () => import('./View.tsx'),
});
