import { defineVisualizer } from '../contract.ts';
import type { EasingEditorProps } from './build.ts';

export default defineVisualizer<EasingEditorProps>({
  id: 'easing-editor',
  load: () => import('./View.tsx'),
});
