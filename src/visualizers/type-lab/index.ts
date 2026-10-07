import { defineVisualizer } from '../contract.ts';
import type { TypeLabProps } from './build.ts';

export default defineVisualizer<TypeLabProps>({
  id: 'type-lab',
  load: () => import('./View.tsx'),
});
