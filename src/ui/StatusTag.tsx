/**
 * OUT / D / Q, known before kickoff and therefore fair game.
 *
 * The one piece of information in this game that is both freely available and
 * decisive, so it appears wherever a name does.
 */
export function StatusTag({ status }: { status: string }) {
  return <span className={`tag tag-${status.toLowerCase()}`}>{status}</span>;
}
