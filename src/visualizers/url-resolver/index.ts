import { defineVisualizer } from '../contract.ts';
import type { UrlResolverProps, UrlTraceProps } from './build.ts';

export default defineVisualizer<UrlResolverProps, UrlTraceProps, string>({
  id: 'url-resolver',
  load: () => import('./View.tsx'),
  loadTrace: () => import('./TraceView.tsx'),
});
