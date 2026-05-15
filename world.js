import * as THREE from 'three';
import { CHUNK, CH, COLORS } from './config.js';

export const worldData = new Map();
export const chunkMeshes = new Map();
export const dirtyChunks = new Set();

// Оптимизация: битовые операции вместо конкатенации строк (без мусора для GC)
export const ckey = (cx, cz) => ((cx & 0xFFFF) << 16) | (cz & 0xFFFF);
const wi = (lx, y, lz) => (y * CHUNK + lz) * CHUNK + lx;

export function genChunk(cx, cz) {
  const key = ckey(cx, cz);
  if (worldData.has(key)) return;
  const arr = new Int8Array(CHUNK * CH * CHUNK);
  worldData.set(key, arr);
  
  for (let lx = 0; lx < CHUNK; lx++) {
    for (let lz = 0; lz < CHUNK; lz++) {
      const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
      const h = Math.max(2, Math.min(CH - 3, Math.floor(8 + Math.sin(wx * .13) * 1.8 + Math.cos(wz * .11) * 2.2 + Math.sin((wx - wz) * .07) * 2.6 + Math.cos((wx + wz * 1.1) * .05) * 2.2)));
      const snow = h > 13, sand = h < 5;
      
      for (let y = 0; y <= h; y++) {
        let id = 3;
        if (y === h) id = snow ? 8 : (sand ? 5 : 1);
        else if (y >= h - 2) id = snow ? 3 : (sand ? 5 : 2);
        arr[wi(lx, y, lz)] = id;
      }
      if (h < 5) for (let y = h + 1; y <= 5; y++) arr[wi(lx, y, lz)] = 7;
      if (!snow && !sand && h >= 5 && Math.random() < .022 && lx > 1 && lz > 1 && lx < 14 && lz < 14) {
        for (let i = 1; i <= 4; i++) arr[wi(lx, h + i, lz)] = 4;
        for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 3; dy <= 5; dy++) {
          const d = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - 4), x2 = lx + dx, z2 = lz + dz, y2 = h + dy;
          if (y2 < CH && x2 >= 0 && x2 < CHUNK && z2 >= 0 && z2 < CHUNK && d < 5 && !arr[wi(x2, y2, z2)]) arr[wi(x2, y2, z2)] = 6;
        }
      }
    }
  }
}

export function gbw(x, y, z) {
  if (y < 0) return 3; 
  if (y >= CH) return 0;
  const arr = worldData.get(ckey(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
  return arr ? arr[wi(((x % CHUNK) + CHUNK) % CHUNK, y, ((z % CHUNK) + CHUNK) % CHUNK)] || 0 : 0;
}

export function sbw(x, y, z, id) {
  if (y < 0 || y >= CH) return;
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  genChunk(cx, cz);
  worldData.get(ckey(cx, cz))[wi(((x % CHUNK) + CHUNK) % CHUNK, y, ((z % CHUNK) + CHUNK) % CHUNK)] = id;
  [ckey(cx, cz), ckey(cx - 1, cz), ckey(cx + 1, cz), ckey(cx, cz - 1), ckey(cx, cz + 1)].forEach(k => dirtyChunks.add(k));
}

// ОПТИМИЗАЦИЯ: Per-Face Culling. Отказались от BoxGeometry.
export function makeChunkMesh(cx, cz, scene) {
  const key = ckey(cx, cz);
  const old = chunkMeshes.get(key);
  if (old) { scene.remove(old); old.geometry.dispose(); old.material.dispose(); }
  
  const arr = worldData.get(key);
  if (!arr) return;

  const positions = [], colors = [], indices = [];
  let indexOffset = 0;

  const faces = [
    { dir: [1, 0, 0], corners: [[1,0,1], [1,0,0], [1,1,0], [1,1,1]] },
    { dir: [-1, 0, 0], corners: [[0,0,0], [0,0,1], [0,1,1], [0,1,0]] },
    { dir: [0, 1, 0], corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]] },
    { dir: [0, -1, 0], corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]] },
    { dir: [0, 0, 1], corners: [[0,0,1], [1,0,1], [1,1,1], [0,1,1]] },
    { dir: [0, 0, -1], corners: [[1,0,0], [0,0,0], [0,1,0], [1,1,0]] }
  ];

  for (let lx = 0; lx < CHUNK; lx++) {
    for (let y = 0; y < CH; y++) {
      for (let lz = 0; lz < CHUNK; lz++) {
        const id = arr[wi(lx, y, lz)];
        if (!id) continue;

        const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
        const col = new THREE.Color(COLORS[id] || 0x888888);

        for (const face of faces) {
          if (!gbw(wx + face.dir[0], y + face.dir[1], wz + face.dir[2])) {
            for (const pos of face.corners) {
              positions.push(wx + pos[0], y + pos[1], wz + pos[2]);
              colors.push(col.r, col.g, col.b);
            }
            indices.push(indexOffset, indexOffset + 1, indexOffset + 2, indexOffset, indexOffset + 2, indexOffset + 3);
            indexOffset += 4;
          }
        }
      }
    }
  }

  if (positions.length === 0) { chunkMeshes.delete(key); return; }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  chunkMeshes.set(key, mesh);
}