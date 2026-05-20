import * as THREE from './vendor/three.module.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, BLOCK_COLORS } from './config.js';
import { getChunkKey, chunkSeed, mulberry32, heightAt, getVoxelIndex } from './worldgen.js';

export { getChunkKey };

export const worldData = new Map();
export const chunkMeshes = new Map();
export const dirtyChunks = new Set();

// Player-modified voxels, keyed "x,y,z" → blockId. Replayed when a chunk is
// (re)generated so edits survive chunk unload/reload, and saved to disk.
export const editedBlocks = new Map();

export function genChunk(cx, cz) {
  const key = getChunkKey(cx, cz);
  if (worldData.has(key)) return;
  const arr = new Int8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
  worldData.set(key, arr);
  const rng = mulberry32(chunkSeed(cx, cz));

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = cx * CHUNK_SIZE + lx, wz = cz * CHUNK_SIZE + lz;
      const h = heightAt(wx, wz);
      const snow = h > 13, sand = h < 5;

      for (let y = 0; y <= h; y++) {
        let id = 3;
        if (y === h) id = snow ? 8 : (sand ? 5 : 1);
        else if (y >= h - 2) id = snow ? 3 : (sand ? 5 : 2);
        arr[getVoxelIndex(lx, y, lz)] = id;
      }
      if (h < 5) for (let y = h + 1; y <= 5; y++) arr[getVoxelIndex(lx, y, lz)] = 7;
      if (!snow && !sand && h >= 5 && rng() < .022 && lx > 1 && lz > 1 && lx < 14 && lz < 14) {
        for (let i = 1; i <= 4; i++) arr[getVoxelIndex(lx, h + i, lz)] = 4;
        for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 3; dy <= 5; dy++) {
          const d = Math.abs(dx) + Math.abs(dz) + Math.abs(dy - 4), x2 = lx + dx, z2 = lz + dz, y2 = h + dy;
          if (y2 < CHUNK_HEIGHT && x2 >= 0 && x2 < CHUNK_SIZE && z2 >= 0 && z2 < CHUNK_SIZE && d < 5 && !arr[getVoxelIndex(x2, y2, z2)]) arr[getVoxelIndex(x2, y2, z2)] = 6;
        }
      }
    }
  }

  // Replay player edits that fall inside this chunk (in-session + loaded saves).
  if (editedBlocks.size) {
    for (const [k, id] of editedBlocks) {
      const [ex, ey, ez] = k.split(',');
      const wx = +ex, wy = +ey, wz = +ez;
      if (wy < 0 || wy >= CHUNK_HEIGHT) continue;
      if (Math.floor(wx / CHUNK_SIZE) !== cx || Math.floor(wz / CHUNK_SIZE) !== cz) continue;
      const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      arr[getVoxelIndex(lx, wy, lz)] = id;
    }
  }
}

export function getBlockAt(x, y, z) {
  if (y < 0) return 3; 
  if (y >= CHUNK_HEIGHT) return 0;
  const arr = worldData.get(getChunkKey(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)));
  return arr ? arr[getVoxelIndex(((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE, y, ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE)] || 0 : 0;
}

export function setBlockAt(x, y, z, id) {
  if (y < 0 || y >= CHUNK_HEIGHT) return;
  const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
  genChunk(cx, cz);
  worldData.get(getChunkKey(cx, cz))[getVoxelIndex(((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE, y, ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE)] = id;
  editedBlocks.set(x + ',' + y + ',' + z, id);
  [
    getChunkKey(cx, cz), 
    getChunkKey(cx - 1, cz), 
    getChunkKey(cx + 1, cz), 
    getChunkKey(cx, cz - 1), 
    getChunkKey(cx, cz + 1)
  ].forEach(k => dirtyChunks.add(k));
}

export function makeChunkMesh(cx, cz, scene) {
  const key = getChunkKey(cx, cz);
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

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
          for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            const id = arr[getVoxelIndex(lx, y, lz)];
            if (!id) continue;

            const wx = cx * CHUNK_SIZE + lx, wz = cz * CHUNK_SIZE + lz;
            const col = new THREE.Color(BLOCK_COLORS[id] || 0x888888);

            for (const face of faces) {
              if (!getBlockAt(wx + face.dir[0], y + face.dir[1], wz + face.dir[2])) {
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
