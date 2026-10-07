import { defineVisualizer } from '../contract.ts';
import type { FlowLabProps } from './build.ts';

export default defineVisualizer<FlowLabProps>({
  id: 'flow-lab',
  load: () => import('./View.tsx'),
});
