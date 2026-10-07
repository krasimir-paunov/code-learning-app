import { defineVisualizer } from '../contract.ts';
import type { GroupLabProps } from './build.ts';

export default defineVisualizer<GroupLabProps>({
  id: 'group-lab',
  load: () => import('./View.tsx'),
});
