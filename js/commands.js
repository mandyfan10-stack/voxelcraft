// js/commands.js — Routes React UI commands (via GameBridge) into authoritative game state.
// Not pure (touches window.GameBridge + game objects) — not unit-tested.
import { playerState, addXp } from './playerstate.js';
import { getItem } from './items.js';
import { RECIPES, doCraft } from './crafting.js';
import { player } from './entities.js';
import { getCrateById } from './crates.js';
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

  // Loot transfer — move one stack from a crate into the player inventory.
  B.on('loot:take', ({ crateId, idx }) => {
    const crate = getCrateById(crateId);
    if (!crate) return;
    const item = crate.contents[idx];
    if (!item) return;
    const leftover = inv().add(item.id, item.count);
    if (leftover === 0)         crate.contents.splice(idx, 1);
    else if (leftover < item.count) crate.contents[idx] = { id: item.id, count: leftover };
    window.GameBridge.setState({ lootOpen: { id: crate.id, type: crate.type, contents: crate.contents.slice() } });
    pushInventory();
  });

  // Take everything possible from the open crate.
  B.on('loot:takeAll', ({ crateId }) => {
    const crate = getCrateById(crateId);
    if (!crate) return;
    for (let i = crate.contents.length - 1; i >= 0; i--) {
      const item = crate.contents[i];
      const leftover = inv().add(item.id, item.count);
      if (leftover === 0)            crate.contents.splice(i, 1);
      else if (leftover < item.count) crate.contents[i] = { id: item.id, count: leftover };
    }
    window.GameBridge.setState({ lootOpen: { id: crate.id, type: crate.type, contents: crate.contents.slice() } });
    pushInventory();
  });

  B.on('loot:close', () => {
    window.GameBridge.setState({ lootOpen: null });
  });
}
