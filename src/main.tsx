import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { STORAGE_KEY } from './storage/gameStore';
import { applyTheme, storedTheme } from './theme';

// Before first paint, so there's no flash of the wrong theme.
applyTheme(storedTheme());

/*
 * `?reset` throws today's progress away and starts the day over.
 *
 * There is otherwise no way back to round one once you've played it — the day
 * is meant to be played once — which is right for a player and useless for
 * anyone testing the thing. Runs before render so the game never mounts on the
 * state it's about to discard, and rewrites the URL so a refresh doesn't
 * silently wipe the round you just played.
 */
if (new URLSearchParams(window.location.search).has('reset')) {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing can refuse storage entirely; nothing to clear if so.
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('reset');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
