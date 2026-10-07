import { defineVisualizer } from '../contract.ts';
import type { ThemeSwitcherProps } from './build.ts';

export default defineVisualizer<ThemeSwitcherProps>({
  id: 'theme-switcher',
  load: () => import('./View.tsx'),
});
