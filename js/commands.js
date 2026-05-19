// js/commands.js — Routes React UI commands (via GameBridge) into authoritative game state.
// Not pure (touches window.GameBridge + game objects) — not unit-tested.
import { playerState, addXp } from './playerstate.js';
import { getItem } from './items.js';
import { RECIPES, doCraft } from './crafting.js';
import { player } from './entities.js';
import { THIRST_MAX } from './config.js';

// `pushInventory` mirrors the authoritative inventory snapshot back to React.
export function initCommands(pushInventory) {
  const B = window.GameBridge;
  const inv = () => playerState.inventory;

  B.on('inv:move',  ({ from, to }) => { inv().move(from, to);    pushInventory(); });
  B.on('inv:split', ({ idx })      => { inv().splitToEmpty(idx); pushInventory(); });
  B.on('inv:drop',  ({ idx })      => { inv().slots[idx] = null; pushInventory(); });

  B.on('selectSlot', (idx) => {
    playerState.selIdx = Math.max(0, Math.min(7, idx | 0));
    pushInventory();
  });

  B.on('craft', (recipeIdx) => {
    const r = RECIPES[recipeIdx];
    if (r && doCraft(inv(), r)) { addXp(4); pushInventory(); }
  });

  B.on('consume', ({ idx }) => {
    const slot = inv().slots[idx];
    if (!slot) return;
    const item = getItem(slot.id);
    if (!item || !item.restore) return;
    const r = item.restore;
    if (r.hunger) player.hunger     = Math.min(100, player.hunger + r.hunger);
    if (r.thirst) playerState.thirst = Math.min(THIRST_MAX, playerState.thirst + r.thirst);
    if (r.hp)     player.hp = Math.max(0, Math.min(playerState.maxHp, player.hp + r.hp));
    inv().removeAt(idx, 1);
    pushInventory();
  });
}
