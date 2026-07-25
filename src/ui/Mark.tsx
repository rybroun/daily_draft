/**
 * The Daily Draft mark: a single letter in a solid block.
 *
 * Drawn rather than set in type so it renders identically before the webfont
 * lands and at any size, and so it never depends on a font being present.
 */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" role="img" aria-label="Daily Draft">
      <rect width="32" height="32" rx="7" className="mark-block" />
      {/* A condensed D, cut as a path so the counter stays crisp at 26px. */}
      <path
        className="mark-letter"
        d="M10 7h6.4c5.4 0 8.6 3.4 8.6 9s-3.2 9-8.6 9H10V7zm5.1 4.3v9.4h1.1c2.7 0 4.2-1.7 4.2-4.7s-1.5-4.7-4.2-4.7h-1.1z"
      />
    </svg>
  );
}
