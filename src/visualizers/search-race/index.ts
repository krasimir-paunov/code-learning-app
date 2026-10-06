import { defineVisualizer } from '../contract.ts';
import type { SearchRaceProps, SearchTraceProps } from './build.ts';

export default defineVisualizer<SearchRaceProps, SearchTraceProps, number>({
  id: 'search-race',
  load: () => import('./View.tsx'),
  loadTrace: () => import('./TraceView.tsx'),
});
