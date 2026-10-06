import { defineVisualizer } from '../contract.ts';
import type { RuleAnatomyProps } from './build.ts';

export default defineVisualizer<RuleAnatomyProps>({
  id: 'rule-anatomy',
  load: () => import('./View.tsx'),
});
