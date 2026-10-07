import { defineVisualizer } from '../contract.ts';
import type { TrackEditorProps } from './build.ts';

export default defineVisualizer<TrackEditorProps>({
  id: 'track-editor',
  load: () => import('./View.tsx'),
});
