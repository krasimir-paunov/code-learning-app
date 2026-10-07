import { defineVisualizer } from '../contract.ts';
import type { A11yAuditProps } from './build.ts';

export default defineVisualizer<A11yAuditProps>({
  id: 'a11y-audit',
  load: () => import('./View.tsx'),
});
