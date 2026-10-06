import { defineVisualizer } from '../contract.ts';
import type { DevtoolsSimProps } from './build.ts';

export default defineVisualizer<DevtoolsSimProps>({
  id: 'devtools-sim',
  load: () => import('./View.tsx'),
});
