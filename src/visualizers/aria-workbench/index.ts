import { defineVisualizer } from '../contract.ts';
import type { AriaWorkbenchProps } from './build.ts';

export default defineVisualizer<AriaWorkbenchProps>({
  id: 'aria-workbench',
  load: () => import('./View.tsx'),
});
