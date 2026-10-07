import { defineVisualizer } from '../contract.ts';
import type { FlexMathProps } from './build.ts';

export default defineVisualizer<FlexMathProps>({
  id: 'flex-math',
  load: () => import('./View.tsx'),
});
