import { defineVisualizer } from '../contract.ts';
import type { ImageLabProps } from './build.ts';

export default defineVisualizer<ImageLabProps>({
  id: 'image-lab',
  load: () => import('./View.tsx'),
});
