import { defineVisualizer } from '../contract.ts';
import type { ActivationLogProps } from './build.ts';

export default defineVisualizer<ActivationLogProps>({
  id: 'activation-log',
  load: () => import('./View.tsx'),
});
