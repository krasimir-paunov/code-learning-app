import { defineVisualizer } from '../contract.ts';
import type { SpecificityDuelProps } from './build.ts';

export default defineVisualizer<SpecificityDuelProps>({
  id: 'specificity-duel',
  load: () => import('./View.tsx'),
});
