import { defineVisualizer } from '../contract.ts';
import type { StepTracerProps } from './build.ts';

export default defineVisualizer<StepTracerProps>({
  id: 'step-tracer',
  load: () => import('./View.tsx'),
});
