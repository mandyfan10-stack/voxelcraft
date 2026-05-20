// js/save.js — World/player persistence via localStorage.
// Only player edits and the game state are stored — terrain is regenerated
// deterministically from the chunk seed when loaded.

import { player } from './entities.js';
import { playerState } from './playerstate.js';
import { editedBlocks } from './world.js';
import { cycle } from './daynight.js';
import { serializeCrates, getNextCrateId, getCratedChunks } from './crates.js';

const KEY = 'voxelfear_save';
const VERSION = 1;

export function serializeGame() {
  return {
    version: VERSION,
    timestamp: Date.now(),
    editedBlocks: Array.from(editedBlocks.entries()),
    cratedChunks: Array.from(getCratedChunks()),
    nextCrateId: getNextCrateId(),
    player: {
      x: player.pos.x, y: player.pos.y, z: player.pos.z,
      yaw: player.yaw, pitch: player.pitch,
      hp: player.hp, hunger: player.hunger, stamina: player.stamina,
      lastAttacker: player.lastAttacker,
    },
    playerState: {
      selIdx: playerState.selIdx,
      xp: playerState.xp, level: playerState.level,
      thirst: playerState.thirst, maxHp: playerState.maxHp,
      perks: { ...playerState.perks },
      stats: { ...playerState.stats },
      inventory: playerState.inventory.serialize(),
    },
    cycle: {
      time: cycle.time, dayCount: cycle.dayCount,
      isNight: cycle.isNight, isBloodMoon: cycle.isBloodMoon,
      bloodMoonWave: cycle.bloodMoonWave,
    },
    crates: serializeCrates(),
  };
}

export function saveGame() {
  try {
    localStorage.setItem(KEY, JSON.stringify(serializeGame()));
    return true;
  } catch (e) {
    console.warn('saveGame failed:', e);
    return false;
  }
}

export function hasSave() {
  try { return localStorage.getItem(KEY) !== null; } catch { return false; }
}

export function readSave() {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    const obj = JSON.parse(s);
    if (obj.version !== VERSION) return null;
    return obj;
  } catch (e) {
    console.warn('readSave failed:', e);
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
