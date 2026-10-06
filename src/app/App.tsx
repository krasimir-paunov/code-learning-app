import { BrowserRouter, Route, Routes } from 'react-router';
import { MotionProvider } from '../effects/MotionProvider.tsx';
import { useProgress } from '../engine/progress/store.ts';
import { AppShell } from './AppShell.tsx';
import { lazyNamed } from './lazy-named.ts';

const LandingPage = lazyNamed(() => import('../features/landing/LandingPage.tsx'), 'LandingPage');
const MapPage = lazyNamed(() => import('../features/map/MapPage.tsx'), 'MapPage');
const LessonPage = lazyNamed(() => import('../features/lesson/LessonPage.tsx'), 'LessonPage');
const ProfilePage = lazyNamed(() => import('../features/profile/ProfilePage.tsx'), 'ProfilePage');
const NotFoundPage = lazyNamed(() => import('./NotFoundPage.tsx'), 'NotFoundPage');

export function App() {
  const effects = useProgress((s) => s.progress.settings.effects);
  return (
    <MotionProvider setting={effects}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="map/:moduleId" element={<MapPage />} />
            <Route path="learn/:lessonId" element={<LessonPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionProvider>
  );
}
