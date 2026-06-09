// js/entities.js — Player state, zombie spawning, AI and melee combat.

import * as THREE from './vendor/three.module.js';
import { PLAYER_CONFIG, REACH_DISTANCE, CHUNK_SIZE, CHUNK_HEIGHT,
         PLAYER_MAX_HP, HP_REGEN_RATE, COMBAT_COOLDOWN, MAX_MOBS,
         STAMINA_MAX, HUNGER_MAX, THIRST_MAX,
         MELEE_RANGE, MELEE_DAMAGE, MELEE_COOLDOWN, BLOOD_MOON_MAX_MOBS } from './config.js';
import { getBlockAt, genChunk } from './world.js';
import { cycle } from './daynight.js';
import { ZOMBIE_TYPES } from './zombies.js';
import { playerState, addXp } from './playerstate.js';
import { getItem } from './items.js';

export const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  yaw: 0, pitch: -.1, onG: false, dead: false,
  hp: PLAYER_MAX_HP,
  stamina: STAMINA_MAX,
  hunger: HUNGER_MAX,
  lastDamageTime:  -999,
  lastMeleeTime:   -999,
  lastAttacker:    'walker',   // zombie type that last hurt the player
  _staminaRegenAcc: 0,   // seconds since last sprint — for regen delay
};

export const mobs = [];
export let closestMobDist = 999;

let _scene = null;
let gameTime = 0;

// ── Physics helpers ──────────────────────────────────────────────────────────

export function checkCollision(pos, r = PLAYER_CONFIG.radius, h = PLAYER_CONFIG.height) {
  const eps = 0.001;
  for (let x = Math.floor(pos.x - r + eps); x <= Math.floor(pos.x + r - eps); x++)
    for (let y = Math.floor(pos.y); y <= Math.floor(pos.y + h - eps); y++)
      for (let z = Math.floor(pos.z - r + eps); z <= Math.floor(pos.z + r - eps); z++)
        if (getBlockAt(x, y, z) > 0) return true;
  return false;
}

export function groundY(x, z) {
  let y = CHUNK_HEIGHT - 1;
  while (y > 1 && !getBlockAt(Math.round(x), y, Math.round(z))) y--;
  return y + .02;
}

export function raycast(camera) {
  const eye = new THREE.Vector3(player.pos.x, player.pos.y + PLAYER_CONFIG.eyeHeight, player.pos.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  let x = Math.floor(eye.x), y = Math.floor(eye.y), z = Math.floor(eye.z);
  const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);
  const tDX = stepX !== 0 ? Math.abs(1/dir.x) : Infinity;
  const tDY = stepY !== 0 ? Math.abs(1/dir.y) : Infinity;
  const tDZ = stepZ !== 0 ? Math.abs(1/dir.z) : Infinity;
  let tMaxX = stepX > 0 ? (x+1-eye.x)*tDX : (eye.x-x)*tDX;
  let tMaxY = stepY > 0 ? (y+1-eye.y)*tDY : (eye.y-y)*tDY;
  let tMaxZ = stepZ > 0 ? (z+1-eye.z)*tDZ : (eye.z-z)*tDZ;
  let prev = null;
  for (let i = 0; i < REACH_DISTANCE * 3; i++) {
    if (getBlockAt(x, y, z) > 0) return { hit: [x, y, z], prev };
    prev = [x, y, z];
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) { x += stepX; tMaxX += tDX; } else { z += stepZ; tMaxZ += tDZ; }
    } else {
      if (tMaxY < tMaxZ) { y += stepY; tMaxY += tDY; } else { z += stepZ; tMaxZ += tDZ; }
    }
  }
  return null;
}

// ── Zombie spawning ──────────────────────────────────────────────────────────

function spawnZombie(scene, typeKey, x, z) {
  const type = ZOMBIE_TYPES[typeKey] || ZOMBIE_TYPES.walker;
  const mob = type.build();
  mob.userData = {
    h: type.h, r: type.r, vy: 0, onG: false,
    type: typeKey, blip: type.blip,
    hp: type.hp, maxHp: type.hp, dead: false,
    spd: type.spd, nightSpd: type.nightSpd, dmg: type.dmg, xp: type.xp,
    lastScream: -999,
  };
  genChunk(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE));
  mob.position.set(x, groundY(x, z) + 3, z);
  scene.add(mob);
  mobs.push(mob);
  return mob;
}

export function spawnMobs(scene) {
  _scene = scene;
  spawnZombie(scene, 'walker', player.pos.x + 14, player.pos.z + 9);
  spawnZombie(scene, 'walker', player.pos.x - 13, player.pos.z - 14);
}

function pickHordeType(bloodMoon) {
  const r = Math.random();
  if (bloodMoon) {
    if (r < 0.42) return 'walker';
    if (r < 0.76) return 'runner';
    if (r < 0.91) return 'brute';
    return 'screamer';
  }
  if (cycle.isNight) {
    if (r < 0.55) return 'walker';
    if (r < 0.85) return 'runner';
    if (r < 0.96) return 'screamer';
    return 'brute';
  }
  if (r < 0.82) return 'walker';
  if (r < 0.95) return 'runner';
  return 'screamer';
}

export function spawnHordeMob(scene, bloodMoon = false) {
  _scene = scene;
  const cap = bloodMoon ? BLOOD_MOON_MAX_MOBS : MAX_MOBS;
  if (mobs.length >= cap) return;
  const angle = Math.random() * Math.PI * 2;
  const dist  = 24 + Math.random() * 16;
  const sx = player.pos.x + Math.cos(angle) * dist;
  const sz = player.pos.z + Math.sin(angle) * dist;
  spawnZombie(scene, pickHordeType(bloodMoon), sx, sz);
}

// Spawn a burst of zombies — used by blood-moon waves.
export function spawnHordeWave(scene, count, bloodMoon = true) {
  for (let i = 0; i < count; i++) spawnHordeMob(scene, bloodMoon);
}

// ── Melee combat ─────────────────────────────────────────────────────────────

function dropZombieLoot(typeKey) {
  playerState.inventory.add('raw_meat', 1);
  if (Math.random() < 0.5)  playerState.inventory.add('bone', 1);
  if (Math.random() < 0.22) playerState.inventory.add('scrap_iron', 1);
  if (typeKey === 'brute' && Math.random() < 0.7) playerState.inventory.add('scrap_iron', 2);
  if (typeKey === 'screamer' && Math.random() < 0.4) playerState.inventory.add('cloth', 1);
}

// Swing at zombies in front of the player. Returns true if the swing connected
// (or there was a zombie to hit) so the caller skips block-mining.
export function meleeAttack() {
  if (player.dead || (gameTime - player.lastMeleeTime) < MELEE_COOLDOWN) return false;
  player.lastMeleeTime = gameTime;

  const slot = playerState.inventory.slots[playerState.selIdx];
  const item = slot ? getItem(slot.id) : null;
  const baseDmg = item && item.weapon ? item.weapon.dmg : MELEE_DAMAGE;
  const dmg = baseDmg * (playerState.perks.meleeDmg || 1);

  const ex = player.pos.x, ey = player.pos.y + PLAYER_CONFIG.eyeHeight, ez = player.pos.z;
  const fwx = -Math.sin(player.yaw) * Math.cos(player.pitch);
  const fwy =  Math.sin(player.pitch);
  const fwz = -Math.cos(player.yaw) * Math.cos(player.pitch);
  let hit = false;
  for (const m of mobs) {
    if (m.userData.dead) continue;
    const dx = m.position.x - ex, dy = (m.position.y + m.userData.h * 0.5) - ey, dz = m.position.z - ez;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < MELEE_RANGE) {
      const dot = (fwx * dx + fwy * dy + fwz * dz) / dist;
      if (dot > 0.45) {
        m.userData.hp -= dmg;
        const fatal = m.userData.hp <= 0;
        if (fatal) {
          m.userData.dead = true;
          addXp(m.userData.xp || 10);
          dropZombieLoot(m.userData.type);
          playerState.stats.kills++;
          window.GameBridge?.emit('kill', { type: m.userData.type });
        }
        window.GameBridge?.emit('hit', { dmg: Math.round(dmg), fatal });
        hit = true;
      }
    }
  }

  // A connecting swing wears down a durable weapon/tool.
  if (hit && slot && slot.durability !== undefined) {
    slot.durability -= 1;
    if (slot.durability <= 0) playerState.inventory.slots[playerState.selIdx] = null;
  }
  return hit;
}

// ── Mob radar blips ───────────────────────────────────────────────────────────

export function getMobBlips() {
  const RADAR_RANGE = 64;
  return mobs.filter(m => !m.userData.dead).map(m => {
    const dx = m.position.x - player.pos.x;
    const dz = m.position.z - player.pos.z;
    const dist = Math.hypot(dx, dz);
    // Project the offset onto the player's forward/right axes so the blip angle
    // is player-relative with 0° = dead ahead and 90° = right — matching the HUD
    // radar's "0 = forward = top" convention. Forward is (-sin, -cos), right is
    // (cos, -sin) (see main.js movement basis); a raw atan2(dx, dz) would put
    // mobs in front of you at the bottom of the radar (front/back inverted).
    const cy = Math.cos(player.yaw), sy = Math.sin(player.yaw);
    const fwd   = -(dx * sy + dz * cy);
    const right =   dx * cy - dz * sy;
    const relAngle = (Math.atan2(right, fwd) * (180 / Math.PI) + 360) % 360;
    return {
      angle: relAngle,
      dist: Math.min(1, dist / RADAR_RANGE),
      kind: m.userData.blip || 'W',
    };
  });
}

// Free the GPU geometry of a removed object tree. Mob/crate meshes allocate a
// fresh BufferGeometry per part on spawn, so scene.remove() alone leaks them.
// Materials/textures are shared module-level singletons (see zombies.js /
// crates.js) reused across instances, so they are intentionally NOT disposed.
export function disposeObject3D(obj) {
  obj.traverse(o => { if (o.geometry) o.geometry.dispose(); });
}

// ── Death & reset ─────────────────────────────────────────────────────────────

export function resetGame() {
  player.dead = false;
  player.hp   = playerState.maxHp;
  player.hunger = HUNGER_MAX;
  player.stamina = STAMINA_MAX;
  playerState.thirst = THIRST_MAX;
  player.lastDamageTime = -999;
  player.lastMeleeTime  = -999;
  player.pos.set(0, groundY(0, 0) + 3, 0);
  player.vel.set(0, 0, 0);
  player.yaw = 0; player.pitch = -.1;

  const skull = document.getElementById('skull');
  const emoji = document.getElementById('skullemoji');
  if (skull) skull.style.display = 'none';
  if (emoji) { emoji.style.fontSize = '0px'; emoji.style.animation = 'none'; }

  // Remove horde mobs, keep only the initial two and heal them.
  if (_scene) {
    while (mobs.length > 2) {
      const m = mobs.pop();
      _scene.remove(m);
      disposeObject3D(m);
    }
  }
  try {
    for (let i = 0; i < mobs.length && i < 2; i++) {
      const off = i === 0 ? [15, 10] : [-15, -15];
      mobs[i].position.set(player.pos.x + off[0], groundY(player.pos.x + off[0], player.pos.z + off[1]) + 5, player.pos.z + off[1]);
      mobs[i].userData.hp = mobs[i].userData.maxHp;
      mobs[i].userData.dead = false;
    }
  } catch (e) { console.error('Mob reset:', e); }
}

function triggerDeath() {
  if (player.dead) return;
  player.dead = true;
  playerState.stats.deaths++;
  if (document.pointerLockElement) document.exitPointerLock();
  window.GameBridge?.emit('death');
}

// ── Mob update ────────────────────────────────────────────────────────────────

const tMobPos  = new THREE.Vector3();
const tMobStep = new THREE.Vector3();

export function updateMobs(dt) {
  gameTime += dt;

  // Remove dead mobs from the scene.
  for (let i = mobs.length - 1; i >= 0; i--) {
    if (mobs[i].userData.dead) {
      if (_scene) _scene.remove(mobs[i]);
      disposeObject3D(mobs[i]);
      mobs.splice(i, 1);
    }
  }

  closestMobDist = 999;
  let inCombat = false;
  const cx = player.pos.x, cz = player.pos.z;
  const summons = [];   // screamer reinforcements, applied after the loop

  for (const m of mobs) {
    const d = m.userData;
    d.vy -= PLAYER_CONFIG.gravity * dt;
    d.onG = false;

    const moveMobAxis = (axis, amt) => {
      if (!amt) return;
      const s = Math.sign(amt); let rem = amt;
      while (Math.abs(rem) > 1e-4) {
        const step = Math.min(Math.abs(rem), 0.05) * s;
        tMobPos.copy(m.position); tMobPos[axis] += step;
        if (!checkCollision(tMobPos, d.r, d.h)) { m.position.copy(tMobPos); rem -= step; continue; }
        if (axis !== 'y' && d.onG) {
          tMobStep.copy(tMobPos); tMobStep.y += 1.02;
          if (!checkCollision(tMobStep, d.r, d.h)) { m.position.copy(tMobStep); rem -= step; continue; }
        }
        if (axis === 'y') { if (s < 0) d.onG = true; d.vy = 0; }
        break;
      }
    };

    moveMobAxis('y', d.vy * dt);

    if (!player.dead) {
      const dx = cx - m.position.x;
      const dz = cz - m.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      closestMobDist = Math.min(closestMobDist, dist);

      if (dist > 1.0 && dist < 44) {
        const spd = cycle.isNight ? d.nightSpd : d.spd;
        moveMobAxis('x', (dx / dist) * spd * dt);
        moveMobAxis('z', (dz / dist) * spd * dt);
        m.rotation.y = Math.atan2(dx, dz);
      }

      // Screamer summons walkers when it has the player in range.
      if (d.type === 'screamer' && dist < 30 && (gameTime - d.lastScream) > 14
          && mobs.length + summons.length < MAX_MOBS + 6) {
        d.lastScream = gameTime;
        window.GameBridge?.emit('scream');
        for (let s = 0; s < 2; s++) {
          const a = Math.random() * Math.PI * 2;
          summons.push({ x: m.position.x + Math.cos(a) * 3, z: m.position.z + Math.sin(a) * 3 });
        }
      }

      if (dist < (d.r + PLAYER_CONFIG.radius + 0.2) && Math.abs(player.pos.y - m.position.y) < d.h) {
        player.hp -= d.dmg * dt;
        player.lastDamageTime = gameTime;
        player.lastAttacker = d.type;
        inCombat = true;
        if (player.hp <= 0) { player.hp = 0; triggerDeath(); }
      }
    }
  }

  for (const s of summons) if (_scene) spawnZombie(_scene, 'walker', s.x, s.z);

  // HP regen when out of combat.
  if (!inCombat && !player.dead && (gameTime - player.lastDamageTime) > COMBAT_COOLDOWN) {
    player.hp = Math.min(playerState.maxHp, player.hp + HP_REGEN_RATE * dt);
  }

  // Catch every source of HP reaching zero (starvation, dehydration, mobs).
  if (!player.dead && player.hp <= 0) { player.hp = 0; triggerDeath(); }
}
