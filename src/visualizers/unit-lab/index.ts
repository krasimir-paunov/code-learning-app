import { defineVisualizer } from '../contract.ts';
import type { UnitLabProps } from './build.ts';

export default defineVisualizer<UnitLabProps>({
  id: 'unit-lab',
  load: () => import('./View.tsx'),
});
