import { defineVisualizer } from '../contract.ts';
import type { BoxInspectorProps } from './build.ts';

export default defineVisualizer<BoxInspectorProps>({
  id: 'box-inspector',
  load: () => import('./View.tsx'),
});
