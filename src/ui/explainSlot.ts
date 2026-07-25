import type { SlotResult } from '../core/types';

/** Why one opening landed where it did, in a sentence. */
export function explainSlot(slot: SlotResult): string {
  if (slot.picked.rank === 1) {
    return `Nobody on the ${slot.spot.slot} wire beat ${slot.picked.player.name}.`;
  }
  const gap = (slot.best.value - slot.picked.value).toFixed(1);
  return `${slot.best.player.name} would have been ${gap} more.`;
}
