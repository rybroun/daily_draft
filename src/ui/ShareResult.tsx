import { useState } from 'react';
import { shareText } from '../core/share';
import type { DateKey, MatchupResult } from '../core/types';
import { browserChannels, deliverShare } from './deliverShare';
import type { Delivery } from './deliverShare';

/**
 * Where a shared result sends whoever reads it.
 *
 * Fixed rather than read from `window.location`, because the game is also
 * served on the tailnet and from a dev server on this machine, and neither is
 * reachable by the person you're pasting to. Wherever it was played, the link
 * has to be the public one.
 */
export const PUBLIC_URL = 'daily-waivers.pages.dev';

interface ShareResultProps {
  date: DateKey;
  /** How each round finished, in order. */
  results: MatchupResult[];
  streak: number;
}

/**
 * The day's result, on its way to someone else.
 *
 * Presentational twice over: what may be said about a finished day is decided
 * by `shareText` in core, and how it leaves the page by `deliverShare`. This
 * holds the button and says what happened.
 */
export function ShareResult({ date, results, streak }: ShareResultProps) {
  const [how, setHow] = useState<Delivery | null>(null);
  const text = shareText({ date, results, streak, url: PUBLIC_URL });

  return (
    <div className="share">
      <button
        type="button"
        className="share-button"
        onClick={() => {
          void deliverShare(text, browserChannels()).then(setHow);
        }}
      >
        {how === 'copied' ? 'Copied' : 'Share result'}
      </button>
      {/*
        Holds its line empty so the foot can't jump, and `role="status"` so the
        confirmation is announced rather than only seen.
      */}
      <p className="share-said" role="status">
        {how === 'copied' ? 'Result copied — paste it anywhere.' : ''}
        {how === 'manual' ? 'Copy this:' : ''}
      </p>
      {how === 'manual' && <pre className="share-text">{text.trimEnd()}</pre>}
    </div>
  );
}
