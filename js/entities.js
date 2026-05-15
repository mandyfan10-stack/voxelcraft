import * as THREE from 'three';
import { P, REACH, CHUNK, CH } from './config.js';
import { gbw, genChunk } from './world.js';

export const player = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: -.1, onG: false };
export const mobs = [];
export let closestMobDist = 999;

export function col(pos) {
  for (let x = Math.floor(pos.x - P.r); x <= Math.floor(pos.x + P.r); x++)
    for (let y = Math.floor(pos.y); y <= Math.floor(pos.y + P.h); y++)
      for (let z = Math.floor(pos.z - P.r); z <= Math.floor(pos.z + P.r); z++)
        if (gbw(x, y, z) > 0) return true;
  return false;
}

export function groundY(x, z) {
  genChunk(Math.floor(x / CHUNK), Math.floor(z / CHUNK));
  let y = CH - 1;
  while (y > 1 && !gbw(Math.round(x), y, Math.round(z))) y--;
  return y + .02;
}

// ОПТИМИЗАЦИЯ: DDA Algorithm (Fast Voxel Traversal) вместо пошагового сдвига
export function raycast(camera) {
  const eye = new THREE.Vector3(player.pos.x, player.pos.y + P.eye, player.pos.z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  let x = Math.floor(eye.x), y = Math.floor(eye.y), z = Math.floor(eye.z);
  const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);
  const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;
  let tMaxX = stepX > 0 ? (x + 1 - eye.x) * tDeltaX : (eye.x - x) * tDeltaX;
  let tMaxY = stepY > 0 ? (y + 1 - eye.y) * tDeltaY : (eye.y - y) * tDeltaY;
  let tMaxZ = stepZ > 0 ? (z + 1 - eye.z) * tDeltaZ : (eye.z - z) * tDeltaZ;

  let prev = null;
  for (let i = 0; i < REACH * 3; i++) {
    if (gbw(x, y, z) > 0) return { hit: [x, y, z], prev };
    prev = [x, y, z];
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) { x += stepX; tMaxX += tDeltaX; } else { z += stepZ; tMaxZ += tDeltaZ; }
    } else {
      if (tMaxY < tMaxZ) { y += stepY; tMaxY += tDeltaY; } else { z += stepZ; tMaxZ += tDeltaZ; }
    }
  }
  return null;
}

// --- Модельки и Мобы (Сокращенно для ясности) ---
const MAT = { skin: new THREE.MeshLambertMaterial({color:0xc38060}) /* ... остальной твой MAT ... */ };
function b(w,h,d,m){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);}

export function makeTroll() {
  const g = new THREE.Group();
  g.add(b(.44,.9,.4, MAT.skin)); // Пример, тут твой полный код генерации тролля
  g.userData = { h: 3.0 };
  return g;
}

export function spawnMobs(scene) {
  const defs = [ {x: player.pos.x+2.5, z: player.pos.z+0.4, mk: makeTroll, spd: .9, type: 'troll'} ];
  for (const d of defs) {
    const mob = d.mk();
    mob.userData = Object.assign(mob.userData||{}, {vx:0, vz:0, walkT:0, idleT:0, headT:0, screamDone:false, spd:d.spd, mobType:d.type});
    genChunk(Math.floor(d.x/CHUNK), Math.floor(d.z/CHUNK));
    mob.position.set(d.x, groundY(d.x, d.z), d.z);
    scene.add(mob); mobs.push(mob);
  }
}

export function updateMobs(dt) {
  closestMobDist = 999;
  const cx = player.pos.x, cz = player.pos.z;
  for (const m of mobs) {
    const d = m.userData;
    const dx = cx - m.position.x, dz = cz - m.position.z;
    const dist = Math.hypot(dx, dz) || 1;
    closestMobDist = Math.min(closestMobDist, dist);
    
    // ... логика преследования (тут твой код updateMobs) ...
  }
}