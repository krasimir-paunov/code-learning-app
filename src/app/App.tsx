import { BrowserRouter, Route, Routes } from 'react-router';
import { MotionProvider } from '../effects/MotionProvider.tsx';
import { AppShell } from './AppShell.tsx';
import { lazyNamed } from './lazy-named.ts';

const LandingPage = lazyNamed(() => import('../features/landing/LandingPage.tsx'), 'LandingPage');
const NotFoundPage = lazyNamed(() => import('./NotFoundPage.tsx'), 'NotFoundPage');

export function App() {
  return (
    <MotionProvider setting="system">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionProvider>
  );
}
