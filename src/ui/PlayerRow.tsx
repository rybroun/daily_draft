import type { Player, RosterSlot, StatLine } from '../core/types';

/**
 * The position badge every fantasy app trained people to scan for first.
 *
 * Here it doubles as the row's colour spine, so position is readable from the
 * left edge without the badge having to be found and read.
 */
export function SlotPill({ slot, color }: { slot: RosterSlot; color: string }) {
  return (
    <span className="pill" style={{ color }}>
      {slot}
    </span>
  );
}

/** OUT and Q are known before kickoff, so they belong wherever a name appears. */
export function StatusTag({ status }: { status: string }) {
  return <span className={`tag tag-${status.toLowerCase()}`}>{status}</span>;
}

interface PlayerRowProps {
  player: Player;
  color: string;
  /** Right-hand number — a projection before the week, a result after. */
  figure: number;
  figureLabel: string;
  form?: StatLine[];
  statLine?: (line: StatLine, player: Player) => string;
  onClick?: () => void;
  selected?: boolean;
}

/**
 * One player, as a lower third rather than a card.
 *
 * A colour spine down the left edge does the work a border used to: it gives
 * the list rhythm and encodes position, without boxing every player into their
 * own container.
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
      style={{ '--spine': color } as React.CSSProperties}
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
