import { defineVisualizer } from '../contract.ts';
import type { SemanticsLensProps } from './build.ts';

export default defineVisualizer<SemanticsLensProps>({
  id: 'semantics-lens',
  load: () => import('./View.tsx'),
});
