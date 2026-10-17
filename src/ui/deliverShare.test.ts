import { describe, expect, it } from 'vitest';
import { deliverShare } from './deliverShare';

/** A channel that records what it was handed, and may refuse. */
function channel(refuseWith: unknown = null) {
  const sent: string[] = [];
  return {
    sent,
    fn: async (text: string) => {
      if (refuseWith !== null) throw refuseWith;
      sent.push(text);
    },
  };
}

const cancelled = new DOMException('cancelled', 'AbortError');

describe('deliverShare', () => {
  it('uses the share sheet when there is one', async () => {
    const share = channel();
    const copy = channel();

    const how = await deliverShare('result', { share: share.fn, copy: copy.fn });

    expect(how).toBe('shared');
    expect(share.sent).toEqual(['result']);
    // The point of the ladder: the rung below is never touched.
    expect(copy.sent).toEqual([]);
  });

  it('copies when the browser has no share sheet', async () => {
    const copy = channel();

    const how = await deliverShare('result', { share: null, copy: copy.fn });

    expect(how).toBe('copied');
    expect(copy.sent).toEqual(['result']);
  });

  it('falls to the clipboard when the sheet fails', async () => {
    const copy = channel();

    const how = await deliverShare('result', {
      share: channel(new Error('no sheet today')).fn,
      copy: copy.fn,
    });

    expect(how).toBe('copied');
    expect(copy.sent).toEqual(['result']);
  });

  it('treats a dismissed sheet as a decision, not a failure', async () => {
    const copy = channel();

    const how = await deliverShare('result', { share: channel(cancelled).fn, copy: copy.fn });

    expect(how).toBe('cancelled');
    // Copying something they chose not to send would be the wrong answer.
    expect(copy.sent).toEqual([]);
  });

  it('asks the player to copy it when neither channel exists', async () => {
    expect(await deliverShare('result', { share: null, copy: null })).toBe('manual');
  });

  it('asks the player to copy it when the clipboard refuses', async () => {
    const how = await deliverShare('result', {
      share: null,
      copy: channel(new Error('denied')).fn,
    });

    expect(how).toBe('manual');
  });
});
