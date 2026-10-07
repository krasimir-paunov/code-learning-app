import { defineVisualizer } from '../contract.ts';
import type { ResponsiveCheckerProps } from './build.ts';

export default defineVisualizer<ResponsiveCheckerProps>({
  id: 'responsive-checker',
  load: () => import('./View.tsx'),
});
