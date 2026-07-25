import type { Theme } from '../theme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

/** Sun and moon, drawn rather than typed so they need no font or emoji. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const toDark = theme === 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={toDark ? 'Switch to night' : 'Switch to day'}
      title={toDark ? 'Night' : 'Day'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {toDark ? (
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.4" />
            <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
          </>
        )}
      </svg>
    </button>
  );
}
