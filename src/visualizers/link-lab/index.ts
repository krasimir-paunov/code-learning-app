import { defineVisualizer } from '../contract.ts';
import type { LinkLabProps } from './build.ts';

export default defineVisualizer<LinkLabProps>({
  id: 'link-lab',
  load: () => import('./View.tsx'),
});
