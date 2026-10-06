import { defineVisualizer } from '../contract.ts';
import type { AnatomyExplorerProps } from './build.ts';

export default defineVisualizer<AnatomyExplorerProps>({
  id: 'anatomy-explorer',
  load: () => import('./View.tsx'),
});
