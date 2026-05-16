import * as THREE from './vendor/three.module.js';
import { CHUNK_SIZE, PLAYER_CONFIG } from './config.js';
import { worldData, chunkMeshes, dirtyChunks, getChunkKey, genChunk, makeChunkMesh, setBlockAt } from './world.js';
import { player, raycast, checkCollision, spawnMobs, updateMobs, groundY } from './entities.js';

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x5577aa);
scene.fog = new THREE.Fog(0x5577aa, 20, 58);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 100);
scene.add(new THREE.HemisphereLight(0xbbd4ff, 0x88aa66, 1.0));
const sun = new THREE.DirectionalLight(0xfff5dd, 0.85); sun.position.set(20, 40, 10); scene.add(sun);

const keys = { w: 0, a: 0, s: 0, d: 0, j: 0 };
let selIdx = 0;
let locked = false;

addEventListener('keydown', e => {
  const c = e.code;
  if (c === 'KeyW') keys.w = 1; else if (c === 'KeyA') keys.a = 1; else if (c === 'KeyS') keys.s = 1; else if (c === 'KeyD') keys.d = 1; else if (c === 'Space') keys.j = 1;
  else if (e.key >= '1' && e.key <= '6') selIdx = +e.key - 1;
});
addEventListener('keyup', e => {
  const c = e.code;
  if (c === 'KeyW') keys.w = 0; else if (c === 'KeyA') keys.a = 0; else if (c === 'KeyS') keys.s = 0; else if (c === 'KeyD') keys.d = 0; else if (c === 'Space') keys.j = 0;
});

// Защита от бесконечного бега при Alt+Tab/смене окон
window.addEventListener('blur', () => {
  keys.w = 0; keys.a = 0; keys.s = 0; keys.d = 0; keys.j = 0;
  wish.set(0, 0, 0);
});

const cvs = document.getElementById('c');
cvs.addEventListener('click', () => { if (!player.dead) cvs.requestPointerLock(); });

cvs.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  const hud = document.getElementById('hud');
  hud.textContent = 'WebGL context lost. Please reload the page.';
  hud.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:18px;background:rgba(0,0,0,.8);padding:20px;border-radius:8px;z-index:999;';
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
  if (e.button === 2) { const r = raycast(camera); if (r && r.prev) setBlockAt(...r.prev, [1, 2, 3, 4, 5, 9][selIdx]); }
});

const tPos = new THREE.Vector3();
const tStep = new THREE.Vector3();
const wish = new THREE.Vector3();
const fw = new THREE.Vector3();
const rt = new THREE.Vector3();

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

const RENDERING_DISTANCE = 4;
let lastChunkUpdate = 0;
const chunkQueue = [];

function updateChunks() {
  const pcx = Math.floor(player.pos.x / CHUNK_SIZE), pcz = Math.floor(player.pos.z / CHUNK_SIZE);
  
  for (let dx = -RENDERING_DISTANCE; dx <= RENDERING_DISTANCE; dx++) {
    for (let dz = -RENDERING_DISTANCE; dz <= RENDERING_DISTANCE; dz++) {
      const cx = pcx + dx, cz = pcz + dz;
      const key = getChunkKey(cx, cz);
      if (!worldData.has(key) || !chunkMeshes.has(key)) {
        if (!chunkQueue.find(c => c.cx === cx && c.cz === cz)) {
          chunkQueue.push({cx, cz});
        }
      }
    }
  }

  chunkQueue.sort((a, b) => {
    return (Math.pow(a.cx - pcx, 2) + Math.pow(a.cz - pcz, 2)) - 
           (Math.pow(b.cx - pcx, 2) + Math.pow(b.cz - pcz, 2));
  });

  for (const k of chunkMeshes.keys()) {
    const [cx, cz] = k.split(',').map(Number);
    if (Math.abs(cx - pcx) > RENDERING_DISTANCE + 1 || Math.abs(cz - pcz) > RENDERING_DISTANCE + 1) {
      const m = chunkMeshes.get(k); 
      scene.remove(m); 
      m.geometry.dispose(); 
      m.material.dispose(); 
      chunkMeshes.delete(k);
      worldData.delete(k); 
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
    const {cx, cz} = chunkQueue.shift();
    genChunk(cx, cz);
    if (!chunkMeshes.has(getChunkKey(cx, cz))) makeChunkMesh(cx, cz, scene);
  }
}

function update(dt) {
  wish.set(0, 0, 0);

  if (!player.dead) {
    let ix = keys.d - keys.a, iz = keys.w - keys.s;
    const len = Math.hypot(ix, iz); 
    if (len > 1) { ix /= len; iz /= len; }
    
    fw.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    rt.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    
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
  
  if (player.pos.y < -10) { player.pos.set(0, groundY(0,0) + 15, 0); }
  
  camera.position.set(player.pos.x, player.pos.y + PLAYER_CONFIG.eyeHeight, player.pos.z);
  camera.rotation.order = 'YXZ'; camera.rotation.y = player.yaw; camera.rotation.x = player.pitch;
  
  updateMobs(dt);
  
  lastChunkUpdate += dt; 
  if (lastChunkUpdate > .2) { 
    updateChunks(); 
    lastChunkUpdate = 0; 
  }
  
  document.getElementById('hud').textContent = `x:${Math.round(player.pos.x)} y:${Math.round(player.pos.y)} z:${Math.round(player.pos.z)} | Dead: ${player.dead}`;
}

const clock = new THREE.Clock();
const FIXED_DT = 1 / 60;
let accumulator = 0;

function loop() {
  requestAnimationFrame(loop);
  
  let frameTime = Math.min(0.25, clock.getDelta());
  accumulator += frameTime;

  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  
  processChunkQueue();
  renderer.render(scene, camera);
}

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

player.pos.set(0, groundY(0,0) + 10, 0);
updateChunks();
while(chunkQueue.length > 0) processChunkQueue();

setTimeout(() => spawnMobs(scene), 60);
loop();
