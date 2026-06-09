import * as THREE from './vendor/three.module.js';
import { CHUNK_SIZE, PLAYER_CONFIG,
         SPRINT_SPEED_MULT, STAMINA_MAX, STAMINA_SPRINT_DRAIN, STAMINA_REGEN_RATE, STAMINA_REGEN_DELAY,
         HUNGER_DRAIN_RATE, HUNGER_STARVATION_DMG,
         THIRST_MAX, THIRST_DRAIN_RATE, THIRST_DEHYDRATION_DMG,
         BLOCK_HARDNESS, HAND_MINE_SPEED } from './config.js';
import { worldData, chunkMeshes, dirtyChunks, getChunkKey, genChunk, makeChunkMesh, setBlockAt, getBlockAt } from './world.js';
import { player, raycast, checkCollision, spawnMobs, spawnHordeMob, spawnHordeWave, updateMobs, groundY, resetGame, meleeAttack, getMobBlips } from './entities.js';
import { cycle, updateCycle, getAtmosphere, getSunDirection } from './daynight.js';
import { playerState, addXp, xpForLevel } from './playerstate.js';
import { initCommands } from './commands.js';
import { getItem, itemMeta, dropForBlock } from './items.js';
import { RECIPES } from './crafting.js';
import { maybeSpawnCrate, findCrateNear, clearCrates, loadCrate, setNextCrateId, setCratedChunks } from './crates.js';
import { initAudio, unlockAudio, startAmbient, updateAmbient } from './audio.js';
import { saveGame, hasSave, readSave } from './save.js';
import { editedBlocks } from './world.js';
import { mobs, disposeObject3D } from './entities.js';
import { IS_TOUCH } from './touch.js';

// ── Renderer ─────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.0 : 1.4));
renderer.setSize(innerWidth, innerHeight);

// ── Scene & Lighting ─────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a5c28);
scene.fog = new THREE.Fog(0x4a5c28, 22, IS_TOUCH ? 36 : 55);

const hemiLight = new THREE.HemisphereLight(0x8fa055, 0x4a3a25, 0.9);
scene.add(hemiLight);
const sun = new THREE.DirectionalLight(0xffe8b0, 0.75);
sun.position.set(20, 40, 10);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, IS_TOUCH ? 60 : 100);

// ── Input ────────────────────────────────────────────────────────────────────

const keys = { w: 0, a: 0, s: 0, d: 0, j: 0, shift: 0 };
let locked = false;
let lmbDown = false;            // hold-to-mine state
let mining = null;              // { x, y, z, progress } while breaking a block
let lookFinger = null;          // touch identifier currently driving the camera
let lookLastX = 0, lookLastY = 0;
let _lastPlaceTick = 0;         // monotonically-incremented by ui/touch.jsx
let _lastInteractTick = 0;

// Helpers shared by keyboard (E / RMB) and touch (PLACE / E action buttons).
function tryPlaceBlock() {
  const slot = playerState.inventory.slots[playerState.selIdx];
  if (!slot) return;
  const item = getItem(slot.id);
  if (!item || !item.place) return;
  const r = raycast(camera);
  if (r && r.prev) {
    setBlockAt(...r.prev, item.blockId);
    playerState.inventory.removeAt(playerState.selIdx, 1);
    playerState.stats.blocksPlaced++;
    pushInventory();
  }
}
function tryInteract() {
  const crate = findCrateNear(player.pos.x, player.pos.y + 1, player.pos.z, 2.6);
  if (crate) {
    window.GameBridge.setState({ lootOpen: { id: crate.id, type: crate.type, contents: crate.contents.slice() } });
    if (document.pointerLockElement) document.exitPointerLock();
    return;
  }
  const r = raycast(camera);
  if (r && getBlockAt(...r.hit) === 7) {
    playerState.thirst = Math.min(THIRST_MAX, playerState.thirst + 22);
    window.GameBridge?.emit('drink');
  }
}

addEventListener('keydown', e => {
  const c = e.code;
  if      (c === 'KeyW')      keys.w = 1;
  else if (c === 'KeyA')      keys.a = 1;
  else if (c === 'KeyS')      keys.s = 1;
  else if (c === 'KeyD')      keys.d = 1;
  else if (c === 'Space')     keys.j = 1;
  else if (c === 'ShiftLeft' || c === 'ShiftRight') keys.shift = 1;
  else if (c === 'KeyE') {
    if (locked && !player.dead) tryInteract();
  }
  else if (e.key >= '1' && e.key <= '8') { playerState.selIdx = +e.key - 1; pushInventory(); }
});
addEventListener('keyup', e => {
  const c = e.code;
  if      (c === 'KeyW')      keys.w = 0;
  else if (c === 'KeyA')      keys.a = 0;
  else if (c === 'KeyS')      keys.s = 0;
  else if (c === 'KeyD')      keys.d = 0;
  else if (c === 'Space')     keys.j = 0;
  else if (c === 'ShiftLeft' || c === 'ShiftRight') keys.shift = 0;
});

window.addEventListener('blur', () => {
  keys.w = 0; keys.a = 0; keys.s = 0; keys.d = 0; keys.j = 0; keys.shift = 0;
  wish.set(0, 0, 0);
});

// ── Game bridge ───────────────────────────────────────────────────────────────
// The React menu mounts instantly, but this module is large (Three.js ~2 MB)
// and deferred — it may finish loading AFTER the player clicks "Start". So the
// "started" flag is read as latched state on GameBridge, never a one-shot event:
// an early click can't be missed.

window.GameBridge.on('respawn', () => { resetGame(); });

const cvs = document.getElementById('c');
cvs.addEventListener('click', () => {
  if (player.dead || !window.GameBridge.state.started) return;
  // Audio unlock + ambient first (works for both mouse and touch via touchend → click).
  unlockAudio();
  startAmbient();
  // Keep the screen on while playing (no-op on browsers without Wake Lock).
  try { navigator.wakeLock?.request('screen').catch(() => {}); } catch { /* ignore */ }
  if (IS_TOUCH) {
    // No pointer lock on touch — taps drive look directly via touch events.
    locked = true;
  } else {
    try { cvs.requestPointerLock(); } catch { /* ignore */ }
  }
});

cvs.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  window.GameBridge?.emit('fatalError', { reason: 'WebGL context lost. The renderer has been disabled — reload to recover.' });
}, false);
cvs.addEventListener('webglcontextrestored', () => { location.reload(); }, false);

document.addEventListener('pointerlockchange', () => {
  if (IS_TOUCH) return;   // touch never enters pointer lock — ignore.
  locked = document.pointerLockElement === cvs;
  if (!locked) { lmbDown = false; mining = null; }
});

// On touch, an open overlay (inventory / settings / loot / menu / death) freezes input.
if (IS_TOUCH) {
  window.GameBridge.on('uiOverlay', (open) => {
    locked = !open && !!window.GameBridge.state.started && !player.dead;
    if (open) { lmbDown = false; mining = null; lookFinger = null; }
  });
}

// Drag-to-look on the canvas (touch). One finger owns the look at a time.
cvs.addEventListener('touchstart', (e) => {
  if (!locked || player.dead) return;
  if (lookFinger !== null) return;
  const t = e.changedTouches[0];
  lookFinger = t.identifier;
  lookLastX = t.clientX;
  lookLastY = t.clientY;
  e.preventDefault();
}, { passive: false });

cvs.addEventListener('touchmove', (e) => {
  if (lookFinger === null) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier !== lookFinger) continue;
    const dx = t.clientX - lookLastX;
    const dy = t.clientY - lookLastY;
    lookLastX = t.clientX;
    lookLastY = t.clientY;
    if (locked && !player.dead) {
      player.yaw -= dx * 0.005;
      player.pitch = Math.max(-1.52, Math.min(1.52, player.pitch - dy * 0.005));
    }
    e.preventDefault();
    return;
  }
}, { passive: false });

function endLookTouch(e) {
  if (lookFinger === null) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === lookFinger) { lookFinger = null; return; }
  }
}
cvs.addEventListener('touchend', endLookTouch);
cvs.addEventListener('touchcancel', endLookTouch);

document.addEventListener('mousemove', e => {
  if (locked && !player.dead) {
    if (Math.abs(e.movementX) > 100 || Math.abs(e.movementY) > 100) return;
    player.yaw -= e.movementX * .0022;
    player.pitch = Math.max(-1.52, Math.min(1.52, player.pitch - e.movementY * .0021));
  }
});

cvs.addEventListener('mousedown', e => {
  if (!locked || player.dead) return;
  if (e.button === 0) {
    lmbDown = true;
    // Snap an instant swing so the very first click feels responsive.
    if (meleeAttack()) { mining = null; pushInventory(); }
  }
  if (e.button === 2) tryPlaceBlock();
});

cvs.addEventListener('mouseup', e => {
  if (e.button === 0) { lmbDown = false; mining = null; }
});

// ── Movement ─────────────────────────────────────────────────────────────────

const tPos  = new THREE.Vector3();
const tStep = new THREE.Vector3();
const wish  = new THREE.Vector3();
const fw    = new THREE.Vector3();
const rt    = new THREE.Vector3();

function movePlayerAxis(a, amt) {
  if (!amt) return;
  const s = Math.sign(amt); let rem = amt;
  while (Math.abs(rem) > 1e-4) {
    const d = Math.min(Math.abs(rem), .05) * s;
    tPos.copy(player.pos); tPos[a] += d;
    if (!checkCollision(tPos)) { player.pos.copy(tPos); rem -= d; continue; }
    if (a !== 'y' && player.onG) {
      tStep.copy(tPos); tStep.y += 1.02;
      if (!checkCollision(tStep)) { player.pos.copy(tStep); rem -= d; continue; }
    }
    player.vel[a] = 0; break;
  }
}

function movePlayerY(amt) {
  if (!amt) return;
  const s = Math.sign(amt); let rem = amt; player.onG = false;
  while (Math.abs(rem) > 1e-4) {
    const d = Math.min(Math.abs(rem), .05) * s;
    tPos.copy(player.pos); tPos.y += d;
    if (!checkCollision(tPos)) { player.pos.copy(tPos); rem -= d; continue; }
    if (s < 0) player.onG = true;
    player.vel.y = 0; break;
  }
}

// ── Chunk management ─────────────────────────────────────────────────────────

let RENDERING_DISTANCE = IS_TOUCH ? 3 : 4;
let lastChunkUpdate = 0;
let autoSaveEnabled = true;
let autoSaveAcc = 0;
const AUTOSAVE_INTERVAL = 30;   // seconds
const chunkQueue = [];

function updateChunks() {
  const pcx = Math.floor(player.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(player.pos.z / CHUNK_SIZE);

  for (let dx = -RENDERING_DISTANCE; dx <= RENDERING_DISTANCE; dx++) {
    for (let dz = -RENDERING_DISTANCE; dz <= RENDERING_DISTANCE; dz++) {
      const cx = pcx + dx, cz = pcz + dz;
      const key = getChunkKey(cx, cz);
      if (!worldData.has(key) || !chunkMeshes.has(key)) {
        if (!chunkQueue.find(c => c.cx === cx && c.cz === cz)) chunkQueue.push({ cx, cz });
      }
    }
  }

  chunkQueue.sort((a, b) =>
    (Math.pow(a.cx - pcx, 2) + Math.pow(a.cz - pcz, 2)) -
    (Math.pow(b.cx - pcx, 2) + Math.pow(b.cz - pcz, 2))
  );

  for (const k of chunkMeshes.keys()) {
    const [cx, cz] = k.split(',').map(Number);
    if (Math.abs(cx - pcx) > RENDERING_DISTANCE + 1 || Math.abs(cz - pcz) > RENDERING_DISTANCE + 1) {
      const m = chunkMeshes.get(k);
      scene.remove(m); m.geometry.dispose(); m.material.dispose();
      chunkMeshes.delete(k); worldData.delete(k);
    }
  }

  for (const k of dirtyChunks) {
    const [cx, cz] = k.split(',').map(Number);
    makeChunkMesh(cx, cz, scene);
  }
  dirtyChunks.clear();
}

function processChunkQueue() {
  if (chunkQueue.length > 0) {
    const { cx, cz } = chunkQueue.shift();
    genChunk(cx, cz);
    if (!chunkMeshes.has(getChunkKey(cx, cz))) makeChunkMesh(cx, cz, scene);
    maybeSpawnCrate(scene, cx, cz);
  }
}

// ── Atmosphere ───────────────────────────────────────────────────────────────

const _skyCol = new THREE.Color();
const _fogCol = new THREE.Color();
const _ambSky = new THREE.Color();
const _ambGnd = new THREE.Color();
const _sunCol = new THREE.Color();

function updateAtmosphere() {
  const atm = getAtmosphere();
  _skyCol.set(atm.skyColor); scene.background = _skyCol;
  _fogCol.set(atm.fogColor); scene.fog.color.copy(_fogCol);
  scene.fog.near = atm.fogNear;
  scene.fog.far  = atm.fogFar;
  _ambSky.set(atm.ambientSky); hemiLight.color.copy(_ambSky);
  _ambGnd.set(atm.ambientGround); hemiLight.groundColor.copy(_ambGnd);
  hemiLight.intensity = atm.ambientIntensity;
  _sunCol.set(atm.sunColor); sun.color.copy(_sunCol);
  sun.intensity = atm.sunIntensity;
  const sd = getSunDirection(cycle.frac);
  sun.position.set(sd.x, sd.y, sd.z);
}

// ── HUD ───────────────────────────────────────────────────────────────────────

let _bridgeTickAcc = 0;
const BRIDGE_TICK = 1 / 10; // push state at 10 Hz, not every frame
let _lastLevel = 1;
let _lastBloodMoon = false;

// Mirror the authoritative inventory snapshot to React (event-driven).
function pushInventory() {
  window.GameBridge.setState({
    inv:    playerState.inventory.serialize(),
    selIdx: playerState.selIdx,
  });
}

function updateHUD() {
  _bridgeTickAcc += FIXED_DT;
  if (_bridgeTickAcc < BRIDGE_TICK) return;
  _bridgeTickAcc = 0;

  // Event-style emits driven by state deltas.
  if (playerState.level > _lastLevel) { window.GameBridge.emit('levelUp'); _lastLevel = playerState.level; }
  if (cycle.isBloodMoon && !_lastBloodMoon) window.GameBridge.emit('bloodMoonStart');
  _lastBloodMoon = cycle.isBloodMoon;

  updateAmbient(cycle.isNight, cycle.isBloodMoon);

  window.GameBridge.setState({
    hp:          Math.max(0, player.hp),
    maxHp:       playerState.maxHp,
    stamina:     Math.max(0, player.stamina),
    hunger:      Math.max(0, player.hunger),
    thirst:      Math.max(0, playerState.thirst),
    dayCount:    cycle.dayCount,
    isNight:     cycle.isNight,
    isBloodMoon: !!cycle.isBloodMoon,
    timeFrac:    cycle.frac,
    posX:        Math.round(player.pos.x),
    posY:        Math.round(player.pos.y),
    posZ:        Math.round(player.pos.z),
    hordeActive: cycle.isNight,
    mobBlips:    getMobBlips(),
    selIdx:      playerState.selIdx,
    xp:          playerState.xp,
    level:       playerState.level,
    levelXp:     xpForLevel(playerState.level),
    nextLevelXp: xpForLevel(playerState.level + 1),
    perks:       playerState.perks,
    stats:       playerState.stats,
    deathCause:  player.lastAttacker,
    mineProgress: mining ? mining.progress : 0,
  });
}

// ── Save / load ──────────────────────────────────────────────────────────────

function clearWorld() {
  for (const mesh of chunkMeshes.values()) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  chunkMeshes.clear();
  worldData.clear();
  dirtyChunks.clear();
  editedBlocks.clear();
  chunkQueue.length = 0;
  while (mobs.length > 0) { const m = mobs.pop(); scene.remove(m); disposeObject3D(m); }
  clearCrates(scene);
}

function loadGameFromSave() {
  const save = readSave();
  if (!save) return false;

  clearWorld();
  for (const [k, id] of save.editedBlocks) editedBlocks.set(k, id);
  setCratedChunks(save.cratedChunks);
  setNextCrateId(save.nextCrateId || 1);

  // Player
  player.pos.set(save.player.x, save.player.y, save.player.z);
  player.yaw = save.player.yaw; player.pitch = save.player.pitch;
  player.hp = save.player.hp; player.hunger = save.player.hunger; player.stamina = save.player.stamina;
  player.lastAttacker = save.player.lastAttacker || 'walker';
  player.dead = false;
  player.vel.set(0, 0, 0);

  // Player state
  const ps = save.playerState;
  playerState.selIdx = ps.selIdx || 0;
  playerState.xp = ps.xp || 0;
  playerState.level = ps.level || 1;
  playerState.thirst = ps.thirst ?? 100;
  playerState.maxHp = ps.maxHp || 100;
  playerState.perks = Object.assign({ miningSpeed: 1, meleeDmg: 1 }, ps.perks);
  playerState.stats = Object.assign({ kills: 0, blocksMined: 0, blocksPlaced: 0, deaths: 0 }, ps.stats);
  playerState.inventory.deserialize(ps.inventory);

  // Cycle
  Object.assign(cycle, save.cycle);

  // Crates
  for (const cdata of save.crates) loadCrate(scene, cdata);

  // Regenerate world around new player position
  updateChunks();
  while (chunkQueue.length > 0) processChunkQueue();

  // Re-spawn the initial mobs
  spawnMobs(scene);

  // Latch state and refresh UI
  window.GameBridge.setState({ started: true, hasSave: true });
  pushInventory();
  _lastLevel = playerState.level;
  _lastBloodMoon = cycle.isBloodMoon;
  return true;
}

// ── Mining (hold LMB) ─────────────────────────────────────────────────────────

function updateMining(dt) {
  if (!lmbDown || player.dead || !locked) {
    if (mining) mining = null;
    return;
  }
  // A connecting swing pre-empts mining this frame.
  if (meleeAttack()) {
    mining = null;
    pushInventory();
    return;
  }
  const r = raycast(camera);
  if (!r) { mining = null; return; }
  const bid = getBlockAt(...r.hit);
  const hardness = BLOCK_HARDNESS[bid];
  if (!bid || hardness === undefined || hardness > 100) { mining = null; return; }

  const slot = playerState.inventory.slots[playerState.selIdx];
  const item = slot ? getItem(slot.id) : null;
  let toolSpeed = HAND_MINE_SPEED;
  let typeMult = 1;
  if (item && item.tool) {
    toolSpeed = item.tool.speed;
    if (item.tool.type === 'axe') {
      if (bid === 4 || bid === 6) typeMult = 1.6;         // wood, leaves
      else if (bid === 3 || bid === 9) typeMult = 0.45;   // stone, concrete
    } else if (item.tool.type === 'pickaxe') {
      if (bid === 3 || bid === 9 || bid === 5) typeMult = 1.6;   // stone-like
      else if (bid === 4 || bid === 6) typeMult = 0.55;          // wood/leaves
    }
  }
  const rate = (toolSpeed * typeMult * (playerState.perks.miningSpeed || 1)) / hardness;

  if (!mining || mining.x !== r.hit[0] || mining.y !== r.hit[1] || mining.z !== r.hit[2]) {
    mining = { x: r.hit[0], y: r.hit[1], z: r.hit[2], progress: 0 };
  }
  mining.progress += dt * rate;

  if (mining.progress >= 1) {
    setBlockAt(mining.x, mining.y, mining.z, 0);
    const drop = dropForBlock(bid);
    if (drop) playerState.inventory.add(drop, 1);
    playerState.stats.blocksMined++;
    addXp(1);
    if (slot && slot.durability !== undefined && item && item.tool) {
      slot.durability -= 1;
      if (slot.durability <= 0) playerState.inventory.slots[playerState.selIdx] = null;
    }
    window.GameBridge.emit('mine');
    pushInventory();
    mining = null;
  }
}

// ── Game update ───────────────────────────────────────────────────────────────

function update(dt) {
  updateAtmosphere(); // atmosphere always updates (world visible behind menu)
  if (!window.GameBridge.state.started) return;
  updateCycle(dt, (info) => {
    if (info.bloodMoon) spawnHordeWave(scene, info.count, true);
    else                spawnHordeMob(scene, false);
  });
  updateHUD();

  // Merge touch input every frame (cheap; only on touch devices).
  if (IS_TOUCH && window.MobileInput) {
    lmbDown = !!window.MobileInput.mine;
    if (window.MobileInput.placeTick !== _lastPlaceTick) {
      _lastPlaceTick = window.MobileInput.placeTick;
      if (locked && !player.dead) tryPlaceBlock();
    }
    if (window.MobileInput.interactTick !== _lastInteractTick) {
      _lastInteractTick = window.MobileInput.interactTick;
      if (locked && !player.dead) tryInteract();
    }
  }

  wish.set(0, 0, 0);
  if (!player.dead) {
    let ix = keys.d - keys.a, iz = keys.w - keys.s;
    if (IS_TOUCH && window.MobileInput) {
      // Joystick replaces W/A/S/D (which are always 0 on touch).
      ix = window.MobileInput.mx;
      iz = -window.MobileInput.mz;
    }
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    fw.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    rt.set( Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    wish.copy(fw).multiplyScalar(iz);
    wish.addScaledVector(rt, ix);

    const moving = len > 0.01;
    // Touch auto-sprints when the joystick is pushed past 95% — no separate sprint button.
    const sprintWanted = keys.shift || (IS_TOUCH && len > 0.95);
    const sprinting = sprintWanted && moving && player.stamina > 0;
    const speedMult = sprinting ? SPRINT_SPEED_MULT : 1.0;
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(PLAYER_CONFIG.speed * speedMult * Math.min(len, 1));
    const jumpPressed = !!keys.j || (IS_TOUCH && !!window.MobileInput?.jump);
    if (player.onG && jumpPressed) { player.vel.y = PLAYER_CONFIG.jumpForce; player.onG = false; }

    // Stamina: drain while sprinting, regen after STAMINA_REGEN_DELAY seconds of rest
    if (sprinting) {
      player.stamina = Math.max(0, player.stamina - STAMINA_SPRINT_DRAIN * dt);
      player._staminaRegenAcc = 0; // reset regen timer
    } else {
      player._staminaRegenAcc += dt;
      if (player._staminaRegenAcc >= STAMINA_REGEN_DELAY) {
        player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_REGEN_RATE * dt);
      }
    }

    // Hunger drain (starvation damage → triggerDeath caught in updateMobs)
    player.hunger = Math.max(0, player.hunger - HUNGER_DRAIN_RATE * dt);
    if (player.hunger <= 0 && !player.dead) {
      player.hp = Math.max(0, player.hp - HUNGER_STARVATION_DMG * dt);
    }

    // Thirst drain — dehydration damage also caught in updateMobs.
    playerState.thirst = Math.max(0, playerState.thirst - THIRST_DRAIN_RATE * dt);
    if (playerState.thirst <= 0 && !player.dead) {
      player.hp = Math.max(0, player.hp - THIRST_DEHYDRATION_DMG * dt);
    }
  }

  const ac = player.onG ? PLAYER_CONFIG.accelerationGround : PLAYER_CONFIG.accelerationAir;
  player.vel.x += (wish.x - player.vel.x) * Math.min(1, ac * dt);
  player.vel.z += (wish.z - player.vel.z) * Math.min(1, ac * dt);
  player.vel.y = Math.max(-28, player.vel.y - PLAYER_CONFIG.gravity * dt);

  movePlayerAxis('x', player.vel.x * dt);
  movePlayerAxis('z', player.vel.z * dt);
  movePlayerY(player.vel.y * dt);

  if (player.pos.y < -10) player.pos.set(0, groundY(0,0) + 15, 0);

  camera.position.set(player.pos.x, player.pos.y + PLAYER_CONFIG.eyeHeight, player.pos.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  updateMining(dt);
  updateMobs(dt);

  lastChunkUpdate += dt;
  if (lastChunkUpdate > .2) { updateChunks(); lastChunkUpdate = 0; }

  // Autosave on a timer once gameplay is rolling.
  if (autoSaveEnabled) {
    autoSaveAcc += dt;
    if (autoSaveAcc >= AUTOSAVE_INTERVAL) {
      autoSaveAcc = 0;
      if (saveGame()) window.GameBridge.setState({ hasSave: true });
    }
  }
}

// ── Loop ──────────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
const FIXED_DT = 1 / 60;
let accumulator = 0;
let _fatalEmitted = false;

function loop() {
  requestAnimationFrame(loop);
  try {
    const frameTime = Math.min(0.25, clock.getDelta());
    accumulator += frameTime;
    while (accumulator >= FIXED_DT) { update(FIXED_DT); accumulator -= FIXED_DT; }
    processChunkQueue();
    renderer.render(scene, camera);
  } catch (e) {
    console.error('render loop error:', e);
    if (!_fatalEmitted) {
      _fatalEmitted = true;
      window.GameBridge?.emit('fatalError', { reason: 'Render loop crashed: ' + (e && e.message ? e.message : String(e)) });
    }
  }
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ── Init ──────────────────────────────────────────────────────────────────────

// Generate the spawn chunks FIRST — groundY() needs real terrain, otherwise it
// returns the empty-world floor and the player spawns trapped inside the ground.
updateChunks();
while (chunkQueue.length > 0) processChunkQueue();
player.pos.set(0, groundY(0, 0) + 3, 0);

// ── Inventory / crafting / audio / save wiring ─────────────────────────────
initCommands(pushInventory);
initAudio();
window.GameBridge.setState({ itemMeta: itemMeta(), recipeMeta: RECIPES, hasSave: hasSave() });

// React → game commands for the meta layer (menu/settings).
window.GameBridge.on('loadGame', () => loadGameFromSave());
window.GameBridge.on('setAutoSave', (v) => { autoSaveEnabled = !!v; });
window.GameBridge.on('setRenderDist', (v) => { RENDERING_DISTANCE = Math.max(2, Math.min(16, v|0)); });
window.GameBridge.on('setFov', (v) => {
  camera.fov = Math.max(50, Math.min(120, v|0));
  camera.updateProjectionMatrix();
});
playerState.inventory.add('wood_pickaxe', 1);
playerState.inventory.add('wood_club', 1);
playerState.inventory.add('cooked_meat', 3);
playerState.inventory.add('water_jar', 2);
playerState.inventory.add('dirt', 16);
playerState.inventory.add('wood', 8);
pushInventory();

setTimeout(() => spawnMobs(scene), 60);
loop();
