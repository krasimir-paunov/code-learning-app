import { defineVisualizer } from '../contract.ts';
import type { ValidationLabProps } from './build.ts';

export default defineVisualizer<ValidationLabProps>({
  id: 'validation-lab',
  load: () => import('./View.tsx'),
});
