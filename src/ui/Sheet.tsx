import type { ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  title: ReactNode;
  note?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The panel that rises over the field when you're looking at one spot.
 *
 * It's the only place a list lives, which is what keeps the game to a single
 * screen: the field is always the page, and detail comes to you rather than
 * sitting below the fold waiting to be scrolled to.
 */
export function Sheet({ open, title, note, onClose, children }: SheetProps) {
  return (
    <div className={`sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <header className="sheet-head">
        <h2 className="sheet-title">{title}</h2>
        {note && <p className="sheet-note">{note}</p>}
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Back to the field">
          ✕
        </button>
      </header>

      <div className="sheet-body">{children}</div>
    </div>
  );
}
