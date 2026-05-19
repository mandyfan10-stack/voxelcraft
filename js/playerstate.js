// js/playerstate.js — Authoritative player progression state. No Three.js/React.
import { Inventory } from './inventory.js';
import { PLAYER_MAX_HP, THIRST_MAX } from './config.js';

// Total XP required to *reach* a level (level 1 = 0). Quadratic ramp.
export function xpForLevel(level) {
  if (level <= 1) return 0;
  const n = level - 1;
  return Math.round(80 * n + 20 * n * n);
}

export function levelForXp(xp) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

export const playerState = {
  inventory: new Inventory(),
  selIdx: 0,                              // selected hotbar slot (0-7) = active item
  xp: 0,
  level: 1,
  thirst: THIRST_MAX,
  maxHp: PLAYER_MAX_HP,
  perks: { miningSpeed: 1, meleeDmg: 1 },
};

// Award XP. Returns the number of levels gained (0 if none).
export function addXp(n) {
  if (n <= 0) return 0;
  playerState.xp += n;
  const lvl = levelForXp(playerState.xp);
  if (lvl > playerState.level) {
    const gained = lvl - playerState.level;
    playerState.level = lvl;
    playerState.maxHp += 10 * gained;
    playerState.perks.miningSpeed += 0.06 * gained;
    playerState.perks.meleeDmg += 0.08 * gained;
    return gained;
  }
  return 0;
}

// The active item (selected hotbar slot), or null.
export function activeItem() {
  return playerState.inventory.slots[playerState.selIdx] || null;
}

export function resetPlayerState() {
  playerState.inventory = new Inventory();
  playerState.selIdx = 0;
  playerState.xp = 0;
  playerState.level = 1;
  playerState.thirst = THIRST_MAX;
  playerState.maxHp = PLAYER_MAX_HP;
  playerState.perks = { miningSpeed: 1, meleeDmg: 1 };
}
