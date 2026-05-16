import * as THREE from './vendor/three.module.js';
import { CHUNK_SIZE, PLAYER_CONFIG } from './config.js';
import { worldData, chunkMeshes, dirtyChunks, getChunkKey, genChunk, makeChunkMesh, setBlockAt } from './world.js';
import { player, raycast, checkCollision, spawnMobs, spawnHordeMob, updateMobs, groundY, resetGame } from './entities.js';
import { cycle, updateCycle, getAtmosphere, getSunDirection } from './daynight.js';

// ── Renderer ─────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
renderer.setSize(innerWidth, innerHeight);

// ── Scene & Lighting ─────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a5c28);
scene.fog = new THREE.Fog(0x4a5c28, 22, 55);

const hemiLight = new THREE.HemisphereLight(0x8fa055, 0x4a3a25, 0.9);
scene.add(hemiLight);
const sun = new THREE.DirectionalLight(0xffe8b0, 0.75);
sun.position.set(20, 40, 10);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 100);

// ── Input ────────────────────────────────────────────────────────────────────

const keys = { w: 0, a: 0, s: 0, d: 0, j: 0 };
let selIdx = 0;
let locked = false;

addEventListener('keydown', e => {
  const c = e.code;
  if      (c === 'KeyW')  keys.w = 1;
  else if (c === 'KeyA')  keys.a = 1;
  else if (c === 'KeyS')  keys.s = 1;
  else if (c === 'KeyD')  keys.d = 1;
  else if (c === 'Space') keys.j = 1;
  else if (e.key >= '1' && e.key <= '6') selIdx = +e.key - 1;
});
addEventListener('keyup', e => {
  const c = e.code;
  if      (c === 'KeyW')  keys.w = 0;
  else if (c === 'KeyA')  keys.a = 0;
  else if (c === 'KeyS')  keys.s = 0;
  else if (c === 'KeyD')  keys.d = 0;
  else if (c === 'Space') keys.j = 0;
});

window.addEventListener('blur', () => {
  keys.w = 0; keys.a = 0; keys.s = 0; keys.d = 0; keys.j = 0;
  wish.set(0, 0, 0);
});

// ── Game bridge ───────────────────────────────────────────────────────────────

let gameActive = false;

window.GameBridge.on('start', () => { gameActive = true; });
window.GameBridge.on('respawn', () => {
  resetGame();
  gameActive = true;
});

const cvs = document.getElementById('c');
cvs.addEventListener('click', () => { if (!player.dead && gameActive) cvs.requestPointerLock(); });

cvs.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  alert('WebGL context lost. Please reload the page.');
}, false);
cvs.addEventListener('webglcontextrestored', () => { location.reload(); }, false);

document.addEventListener('pointerlockchange', () => locked = document.pointerLockElement === cvs);

document.addEventListener('mousemove', e => {
  if (locked && !player.dead) {
    if (Math.abs(e.movementX) > 100 || Math.abs(e.movementY) > 100) return;
    player.yaw -= e.movementX * .0022;
    player.pitch = Math.max(-1.52, Math.min(1.52, player.pitch - e.movementY * .0021));
  }
});

cvs.addEventListener('mousedown', e => {
  if (!locked || player.dead) return;
  if (e.button === 0) { const r = raycast(camera); if (r) setBlockAt(...r.hit, 0); }
  if (e.button === 2) { const r = raycast(camera); if (r && r.prev) setBlockAt(...r.prev, [1,2,3,4,5,9][selIdx]); }
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

const RENDERING_DISTANCE = 4;
let lastChunkUpdate = 0;
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

function updateHUD() {
  _bridgeTickAcc += FIXED_DT;
  if (_bridgeTickAcc < BRIDGE_TICK) return;
  _bridgeTickAcc = 0;

  window.GameBridge.setState({
    hp:          Math.max(0, player.hp),
    maxHp:       100,
    dayCount:    cycle.dayCount,
    isNight:     cycle.isNight,
    timeFrac:    cycle.frac,
    posX:        Math.round(player.pos.x),
    posY:        Math.round(player.pos.y),
    posZ:        Math.round(player.pos.z),
    hordeActive: cycle.isNight,
  });
}

// ── Game update ───────────────────────────────────────────────────────────────

function update(dt) {
  updateAtmosphere(); // atmosphere always updates (world visible behind menu)
  if (!gameActive) return;
  updateCycle(dt, () => spawnHordeMob(scene));
  updateHUD();

  wish.set(0, 0, 0);
  if (!player.dead) {
    let ix = keys.d - keys.a, iz = keys.w - keys.s;
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    fw.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    rt.set( Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    wish.copy(fw).multiplyScalar(iz);
    wish.addScaledVector(rt, ix);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(PLAYER_CONFIG.speed * Math.min(len, 1));
    if (player.onG && keys.j) { player.vel.y = PLAYER_CONFIG.jumpForce; player.onG = false; }
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

  updateMobs(dt);

  lastChunkUpdate += dt;
  if (lastChunkUpdate > .2) { updateChunks(); lastChunkUpdate = 0; }
}

// ── Loop ──────────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
const FIXED_DT = 1 / 60;
let accumulator = 0;

function loop() {
  requestAnimationFrame(loop);
  const frameTime = Math.min(0.25, clock.getDelta());
  accumulator += frameTime;
  while (accumulator >= FIXED_DT) { update(FIXED_DT); accumulator -= FIXED_DT; }
  processChunkQueue();
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ── Init ──────────────────────────────────────────────────────────────────────

player.pos.set(0, groundY(0,0) + 10, 0);
updateChunks();
while (chunkQueue.length > 0) processChunkQueue();
setTimeout(() => spawnMobs(scene), 60);
loop();
