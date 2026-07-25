export type Theme = 'light' | 'dark';

const KEY = 'daily_draft.theme';

/**
 * Light is the game, dark is an option.
 *
 * Deliberately *not* wired to `prefers-color-scheme`: most phones sit in dark
 * appearance permanently, which would mean almost nobody ever sees the version
 * this was designed as. The system setting is about reading apps at night; this
 * is a Sunday afternoon.
 */
export function storedTheme(): Theme {
  try {
    return window.localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // The theme still applies for this visit; it just won't be remembered.
  }
}
