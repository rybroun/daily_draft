import type { Player, RosterSlot, StatLine } from '../core/types';

interface PillProps {
  slot: RosterSlot;
  color: string;
}

/** The position badge every fantasy app trained people to scan for first. */
export function SlotPill({ slot, color }: PillProps) {
  return (
    <span
      className="pill"
      style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {slot}
    </span>
  );
}

/** OUT and Q are known before kickoff, so they belong wherever a name appears. */
export function StatusTag({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}

interface PlayerRowProps {
  player: Player;
  color: string;
  /** Right-hand number — a projection before the week, a result after. */
  figure: number;
  figureLabel: string;
  /** Form lines, omitted where the row is only meant to be scanned. */
  form?: StatLine[];
  statLine?: (line: StatLine, player: Player) => string;
  onClick?: () => void;
  selected?: boolean;
}

/**
 * One player, as a row rather than a card.
 *
 * Rows separated by a hairline read as a list you can run your eye down. Boxing
 * each one turns the same information into a stack of objects to be examined
 * separately, which is slower and looks heavier.
 */
export function PlayerRow({
  player,
  color,
  figure,
  figureLabel,
  form,
  statLine,
  onClick,
  selected = false,
}: PlayerRowProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`row${selected ? ' is-selected' : ''}${onClick ? ' is-tappable' : ''}`}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': selected } : {})}
    >
      <SlotPill slot={player.slot} color={color} />

      <span className="row-identity">
        <span className="row-name">
          {player.name}
          {player.status && <StatusTag status={player.status} />}
        </span>
        <span className="row-team">{player.team}</span>
      </span>

      <span className="row-figure">
        <span className="row-figure-value">{figure.toFixed(1)}</span>
        <span className="row-figure-label">{figureLabel}</span>
      </span>

      {form && statLine && (
        <span className="row-form">
          {form.map((line) => (
            <span key={line.label} className="form-line">
              <span className="form-label">{line.label}</span>
              <span className="form-stats">{statLine(line, player)}</span>
            </span>
          ))}
        </span>
      )}
    </Tag>
  );
}
