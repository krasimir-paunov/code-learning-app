import { defineVisualizer } from '../contract.ts';
import type { FormInspectorProps } from './build.ts';

export default defineVisualizer<FormInspectorProps>({
  id: 'form-inspector',
  load: () => import('./View.tsx'),
});
