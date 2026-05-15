import * as THREE from 'three';
import { CHUNK, P } from './config.js';
import { worldData, chunkMeshes, dirtyChunks, ckey, genChunk, makeChunkMesh, sbw } from './world.js';
import { player, raycast, col, spawnMobs, updateMobs, groundY } from './entities.js';

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

// ИСПРАВЛЕНО: Чтение e.code (физическая клавиша) игнорирует русскую/английскую раскладку
addEventListener('keydown', e => {
  const c = e.code;
  if (c === 'KeyW') keys.w = 1; 
  else if (c === 'KeyA') keys.a = 1; 
  else if (c === 'KeyS') keys.s = 1; 
  else if (c === 'KeyD') keys.d = 1; 
  else if (c === 'Space') keys.j = 1;
  else if (e.key >= '1' && e.key <= '6') selIdx = +e.key - 1;
});

addEventListener('keyup', e => {
  const c = e.code;
  if (c === 'KeyW') keys.w = 0; 
  else if (c === 'KeyA') keys.a = 0; 
  else if (c === 'KeyS') keys.s = 0; 
  else if (c === 'KeyD') keys.d = 0; 
  else if (c === 'Space') keys.j = 0;
});

const cvs = document.getElementById('c');
cvs.addEventListener('click', () => { if (!player.dead) cvs.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => locked = document.pointerLockElement === cvs);

document.addEventListener('mousemove', e => { 
  if (locked && !player.dead) { 
    player.yaw -= e.movementX * .0022; 
    player.pitch = Math.max(-1.52, Math.min(1.52, player.pitch - e.movementY * .0021)); 
  } 
});

cvs.addEventListener('mousedown', e => {
  if (!locked || player.dead) return;
  if (e.button === 0) { const r = raycast(camera); if (r) sbw(...r.hit, 0); }
  if (e.button === 2) { const r = raycast(camera); if (r && r.prev) sbw(...r.prev, [1, 2, 3, 4, 5, 9][selIdx]); }
});

function mvAxis(a, amt) {
  if (!amt) return;
  const s = Math.sign(amt); let rem = amt;
  while (Math.abs(rem) > 1e-4) {
    const d = Math.min(Math.abs(rem), .05) * s; const t = player.pos.clone(); t[a] += d;
    if (!col(t)) { player.pos.copy(t); rem -= d; continue; }
    if (a !== 'y' && player.onG) { const ts = t.clone(); ts.y += 1.02; if (!col(ts)) { player.pos.copy(ts); rem -= d; continue; } }
    player.vel[a] = 0; break;
  }
}
function mvY(amt) {
  if (!amt) return;
  const s = Math.sign(amt); let rem = amt; player.onG = false;
  while (Math.abs(rem) > 1e-4) {
    const d = Math.min(Math.abs(rem), .05) * s; const t = player.pos.clone(); t.y += d;
    if (!col(t)) { player.pos.copy(t); rem -= d; continue; } if (s < 0) player.onG = true; player.vel.y = 0; break;
  }
}

const RDIST = 4;
let lastCU = 0;
function updateChunks() {
  const pcx = Math.floor(player.pos.x / CHUNK), pcz = Math.floor(player.pos.z / CHUNK);
  for (let dx = -RDIST; dx <= RDIST; dx++) for (let dz = -RDIST; dz <= RDIST; dz++) {
    const cx = pcx + dx, cz = pcz + dz; genChunk(cx, cz);
    if (!chunkMeshes.has(ckey(cx, cz))) makeChunkMesh(cx, cz, scene);
  }
  for (const k of chunkMeshes.keys()) {
    const cx = (k >> 16), cz = (k << 16) >> 16;
    if (Math.abs(cx - pcx) > RDIST + 1 || Math.abs(cz - pcz) > RDIST + 1) {
      const m = chunkMeshes.get(k); scene.remove(m); m.geometry.dispose(); m.material.dispose(); chunkMeshes.delete(k);
    }
  }
  for (const k of dirtyChunks) { const cx = (k >> 16), cz = (k << 16) >> 16; makeChunkMesh(cx, cz, scene); }
  dirtyChunks.clear();
}

const clock = new THREE.Clock();
function update(dt) {
  let wish = new THREE.Vector3();

  if (!player.dead) {
    let ix = keys.d - keys.a, iz = keys.w - keys.s;
    const len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; }
    const fw = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const rt = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    wish = fw.clone().multiplyScalar(iz).add(rt.clone().multiplyScalar(ix));
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(P.spd * Math.min(len, 1));
    if (player.onG && keys.j) { player.vel.y = P.jmp; player.onG = false; }
  }

  const ac = player.onG ? P.acc : P.aac;
  player.vel.x += (wish.x - player.vel.x) * Math.min(1, ac * dt);
  player.vel.z += (wish.z - player.vel.z) * Math.min(1, ac * dt);
  
  player.vel.y = Math.max(-28, player.vel.y - P.grav * dt);
  
  mvAxis('x', player.vel.x * dt); mvAxis('z', player.vel.z * dt); mvY(player.vel.y * dt);
  
  if (player.pos.y < -10) { player.pos.set(0, groundY(0,0) + 15, 0); }
  
  camera.position.set(player.pos.x, player.pos.y + P.eye, player.pos.z);
  camera.rotation.order = 'YXZ'; camera.rotation.y = player.yaw; camera.rotation.x = player.pitch;
  
  updateMobs(dt);
  
  lastCU += dt; if (lastCU > .15) { updateChunks(); lastCU = 0; }
  
  document.getElementById('hud').textContent = `x:${Math.round(player.pos.x)} y:${Math.round(player.pos.y)} z:${Math.round(player.pos.z)} | Dead: ${player.dead}`;
}

function loop() {
  requestAnimationFrame(loop);
  update(Math.min(.05, clock.getDelta()));
  renderer.render(scene, camera);
}

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

player.pos.set(0, groundY(0,0) + 10, 0);
updateChunks();
setTimeout(() => spawnMobs(scene), 60);
loop();
