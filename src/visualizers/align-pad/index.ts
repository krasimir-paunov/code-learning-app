import { defineVisualizer } from '../contract.ts';
import type { AlignPadProps } from './build.ts';

export default defineVisualizer<AlignPadProps>({
  id: 'align-pad',
  load: () => import('./View.tsx'),
});
