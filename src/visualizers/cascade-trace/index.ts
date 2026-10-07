import { defineVisualizer } from '../contract.ts';
import type { CascadeTraceProps } from './build.ts';

export default defineVisualizer<CascadeTraceProps>({
  id: 'cascade-trace',
  load: () => import('./View.tsx'),
});
