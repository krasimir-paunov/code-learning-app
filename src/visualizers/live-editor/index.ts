import { defineVisualizer } from '../contract.ts';
import type { LiveEditorProps } from './build.ts';

export default defineVisualizer<LiveEditorProps>({
  id: 'live-editor',
  load: () => import('./View.tsx'),
});
