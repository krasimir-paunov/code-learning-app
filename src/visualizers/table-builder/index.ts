import { defineVisualizer } from '../contract.ts';
import type { TableBuilderProps } from './build.ts';

export default defineVisualizer<TableBuilderProps>({
  id: 'table-builder',
  load: () => import('./View.tsx'),
});
