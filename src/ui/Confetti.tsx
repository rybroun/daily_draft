/**
 * A burst over the field when the round is won.
 *
 * Hand-placed rather than random: the day is deterministic everywhere else, and
 * a celebration that lands differently each time you refresh the same finished
 * round would be the one thing on screen that isn't reproducible.
 *
 * Purely decorative, so it's hidden from assistive technology — the result is
 * already stated in words on the paint and was just read out in the play-out.
 */
const PIECES = [
  { x: 8, delay: 0, drift: -14, spin: 420, tone: 'a' },
  { x: 17, delay: 120, drift: 9, spin: -300, tone: 'b' },
  { x: 26, delay: 40, drift: -6, spin: 260, tone: 'c' },
  { x: 34, delay: 200, drift: 12, spin: -480, tone: 'a' },
  { x: 43, delay: 90, drift: -11, spin: 340, tone: 'b' },
  { x: 50, delay: 10, drift: 4, spin: -220, tone: 'c' },
  { x: 58, delay: 170, drift: -8, spin: 400, tone: 'a' },
  { x: 66, delay: 60, drift: 14, spin: -360, tone: 'b' },
  { x: 74, delay: 230, drift: -5, spin: 300, tone: 'c' },
  { x: 82, delay: 110, drift: 10, spin: -420, tone: 'a' },
  { x: 90, delay: 30, drift: -13, spin: 380, tone: 'b' },
  { x: 96, delay: 150, drift: 6, spin: -260, tone: 'c' },
];

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map((piece) => (
        <span
          key={piece.x}
          className={`confetti-piece is-${piece.tone}`}
          style={
            {
              left: `${piece.x}%`,
              animationDelay: `${piece.delay}ms`,
              '--drift': `${piece.drift}vw`,
              '--spin': `${piece.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
