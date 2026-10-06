import { defineVisualizer } from '../contract.ts';
import type { SkeletonTogglesProps } from './build.ts';

export default defineVisualizer<SkeletonTogglesProps>({
  id: 'skeleton-toggles',
  load: () => import('./View.tsx'),
});
