import { defineVisualizer } from '../contract.ts';
import type { SpecCheckerProps } from './build.ts';

export default defineVisualizer<SpecCheckerProps>({
  id: 'spec-checker',
  load: () => import('./View.tsx'),
});
