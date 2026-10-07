import { defineVisualizer } from '../contract.ts';
import type { LayoutChooserProps } from './build.ts';

export default defineVisualizer<LayoutChooserProps>({
  id: 'layout-chooser',
  load: () => import('./View.tsx'),
});
