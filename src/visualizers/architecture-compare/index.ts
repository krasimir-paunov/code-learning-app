import { defineVisualizer } from '../contract.ts';
import type { ArchitectureCompareProps } from './build.ts';

export default defineVisualizer<ArchitectureCompareProps>({
  id: 'architecture-compare',
  load: () => import('./View.tsx'),
});
