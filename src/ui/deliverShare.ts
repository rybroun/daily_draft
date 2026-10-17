/** What became of an attempt to get the result out of the page. */
export type Delivery = 'shared' | 'copied' | 'cancelled' | 'manual';

export interface Channels {
  /** The native share sheet, or null where the browser has none. */
  share: ((text: string) => Promise<void>) | null;
  /** The clipboard, or null where the browser won't give us one. */
  copy: ((text: string) => Promise<void>) | null;
}

/**
 * Get the result out of the page, by the best channel that will have it.
 *
 * The order is how well each one works on a phone, which is where this game is
 * played: the native sheet puts the result straight into Messages, the
 * clipboard needs the player to find the paste themselves, and the last resort
 * is showing them the text to select by hand.
 *
 * Both of the good channels can refuse — no permission, no clipboard at all
 * over plain HTTP, a sheet the browser declines to open — so every one of them
 * is allowed to fail and the ladder keeps going. The one case that is *not* a
 * failure is the player dismissing the sheet: that's a decision, and quietly
 * copying something they chose not to send would be the wrong answer to it.
 *
 * Split out of the component and given the channels rather than reaching for
 * `navigator` so the ladder can be tested against fakes, the way storage is.
 */
export async function deliverShare(text: string, channels: Channels): Promise<Delivery> {
  if (channels.share) {
    try {
      await channels.share(text);
      return 'shared';
    } catch (error) {
      if (isCancellation(error)) return 'cancelled';
      // Anything else means the sheet didn't work, so try the next rung.
    }
  }

  if (channels.copy) {
    try {
      await channels.copy(text);
      return 'copied';
    } catch {
      // Falls through to showing it.
    }
  }

  return 'manual';
}

/** The browser's way of saying the player closed the sheet. */
function isCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** The real browser's channels, each left out when it isn't there. */
export function browserChannels(): Channels {
  return {
    share:
      typeof navigator.share === 'function' ? (text) => navigator.share({ text }) : null,
    copy:
      typeof navigator.clipboard?.writeText === 'function'
        ? (text) => navigator.clipboard.writeText(text)
        : null,
  };
}
