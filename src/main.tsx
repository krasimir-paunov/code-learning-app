import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';
import { App } from './app/App.tsx';
import { preloadRoute } from './app/routes.ts';
import { startProgressPersistence } from './engine/progress/store.ts';

startProgressPersistence();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// Render once the first screen's code (already modulepreloaded by the route shell) is loaded, so
// the initial route never suspends. Not a top-level await: route chunks import shared code from
// this entry chunk, which must finish evaluating first.
const path = window.location.pathname.slice(import.meta.env.BASE_URL.length - 1);
void preloadRoute(path)
  .catch(() => {
    // A chunk that fails to load is reported by the route's error boundary when it renders.
  })
  .then(() =>
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
