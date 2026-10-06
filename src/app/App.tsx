import { BrowserRouter, Route, Routes } from 'react-router';
import { MotionProvider } from '../effects/MotionProvider.tsx';
import { useProgress } from '../engine/progress/store.ts';
import { AppShell } from './AppShell.tsx';
import { landing, lesson, map, notFound, profile, sheets } from './routes.ts';

export function App() {
  const effects = useProgress((s) => s.progress.settings.effects);
  return (
    <MotionProvider setting={effects}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<landing.Component />} />
            <Route path="map" element={<map.Component />} />
            <Route path="map/:moduleId" element={<map.Component />} />
            <Route path="learn/:lessonId" element={<lesson.Component />} />
            <Route path="cheatsheets" element={<sheets.Component />} />
            <Route path="cheatsheets/:track" element={<sheets.Component />} />
            <Route path="profile" element={<profile.Component />} />
            <Route path="*" element={<notFound.Component />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionProvider>
  );
}
