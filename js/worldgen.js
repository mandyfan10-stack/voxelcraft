// js/worldgen.js — Pure terrain math + RNG. No Three.js, no DOM (unit-testable).

import { CHUNK_SIZE, CHUNK_HEIGHT } from './config.js';

// Flat array index for a voxel inside a chunk's CHUNK_SIZE^2 × CHUNK_HEIGHT grid.
export const getVoxelIndex = (lx, y, lz) => (y * CHUNK_SIZE + lz) * CHUNK_SIZE + lx;

// String key for the chunkMeshes/worldData maps.
export const getChunkKey = (cx, cz) => cx + ',' + cz;

// Hash for the per-chunk PRNG seed — splat-tested to be well-distributed.
export function chunkSeed(cx, cz) {
  let h = (cx * 1664525 + cz * 1013904223) ^ 0xdeadbeef;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return h ^ (h >>> 16);
}

// Mulberry32 PRNG factory — fast, deterministic, good enough for terrain features.
export function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Terrain height at world (x, z). Deterministic; clamped into the playable Y range.
export function heightAt(wx, wz) {
  return Math.max(2, Math.min(CHUNK_HEIGHT - 3,
    Math.floor(8
      + Math.sin(wx * 0.13) * 1.8
      + Math.cos(wz * 0.11) * 2.2
      + Math.sin((wx - wz) * 0.07) * 2.6
      + Math.cos((wx + wz * 1.1) * 0.05) * 2.2)));
}
