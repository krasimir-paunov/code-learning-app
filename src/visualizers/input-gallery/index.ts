import { defineVisualizer } from '../contract.ts';
import type { InputGalleryProps } from './build.ts';

export default defineVisualizer<InputGalleryProps>({
  id: 'input-gallery',
  load: () => import('./View.tsx'),
});
