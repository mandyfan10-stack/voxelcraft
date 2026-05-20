// js/crates.js — Loot-crate meshes and world placement. Imports Three.js.

import * as THREE from './vendor/three.module.js';
import { rollLoot } from './loot.js';
import { groundY } from './entities.js';
import { CHUNK_SIZE, CHUNK_HEIGHT } from './config.js';

export const crates = [];
let nextCrateId = 1;

// One chunk = one crate roll. The set survives chunk unload/reload so we never
// duplicate crates when the player wanders back and forth.
const cratedChunks = new Set();

const M_WOOD     = new THREE.MeshLambertMaterial({ color: 0x6b4828 });
const M_RUST     = new THREE.MeshLambertMaterial({ color: 0x8a4a20 });
const M_METAL    = new THREE.MeshLambertMaterial({ color: 0x4a463c });
const M_EDGE     = new THREE.MeshLambertMaterial({ color: 0x2a2218 });
const M_HIGHLIGHT = new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0xff8800, emissiveIntensity: 0.3 });

function makeCrateMesh(type) {
  const g = new THREE.Group();
  let w, h, d, body;
  if (type === 'toolbox') {
    [w, h, d] = [0.6, 0.45, 0.5];
    body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_RUST);
  } else if (type === 'ammoCrate') {
    [w, h, d] = [0.7, 0.6, 0.7];
    body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_METAL);
  } else {
    [w, h, d] = [0.8, 0.7, 0.5];
    body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M_WOOD);
  }
  body.position.y = h / 2;
  g.add(body);
  // dark trim band on the lid edge
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.06, d + 0.04), M_EDGE);
  trim.position.y = h + 0.02;
  g.add(trim);
  // small glow stud — pickup hint
  const stud = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), M_HIGHLIGHT);
  stud.position.set(0, h + 0.10, d / 2 + 0.02);
  g.add(stud);
  g.userData = { dim: [w, h, d] };
  return g;
}

export function spawnCrate(scene, x, y, z, type = 'cabinet') {
  const mesh = makeCrateMesh(type);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  const contents = rollLoot(type);
  const crate = { id: nextCrateId++, type, mesh, contents, pos: [x, y, z] };
  crates.push(crate);
  return crate;
}

// Called once per chunk by main.js after world data is generated.
const TYPES = ['cabinet', 'toolbox', 'ammoCrate'];
export function maybeSpawnCrate(scene, cx, cz) {
  const key = cx + ',' + cz;
  if (cratedChunks.has(key)) return;
  cratedChunks.add(key);
  if (Math.random() > 0.32) return;
  const lx = Math.floor(Math.random() * (CHUNK_SIZE - 4)) + 2;
  const lz = Math.floor(Math.random() * (CHUNK_SIZE - 4)) + 2;
  const wx = cx * CHUNK_SIZE + lx, wz = cz * CHUNK_SIZE + lz;
  const y = groundY(wx, wz);
  if (y < 2 || y > CHUNK_HEIGHT - 3) return;
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  spawnCrate(scene, wx + 0.5, y, wz + 0.5, type);
}

// Find the closest crate to (x,y,z) within `maxDist`, or null.
export function findCrateNear(x, y, z, maxDist = 2.6) {
  let best = null, bestD = maxDist;
  for (const c of crates) {
    const dx = c.pos[0] - x, dy = c.pos[1] - y, dz = c.pos[2] - z;
    const d = Math.hypot(dx, dy, dz);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best;
}

export function getCrateById(id) {
  return crates.find(c => c.id === id) || null;
}

// ── Save/load hooks ──────────────────────────────────────────────────────────

export function serializeCrates() {
  return crates.map(c => ({ id: c.id, type: c.type, pos: c.pos.slice(), contents: c.contents.map(x => ({ ...x })) }));
}
export function getNextCrateId()       { return nextCrateId; }
export function setNextCrateId(n)      { nextCrateId = n; }
export function getCratedChunks()      { return cratedChunks; }
export function setCratedChunks(list) {
  cratedChunks.clear();
  if (Array.isArray(list)) for (const k of list) cratedChunks.add(k);
}
export function clearCrates(scene) {
  for (const c of crates) scene.remove(c.mesh);
  crates.length = 0;
  nextCrateId = 1;
}
export function loadCrate(scene, data) {
  const mesh = makeCrateMesh(data.type);
  mesh.position.set(data.pos[0], data.pos[1], data.pos[2]);
  scene.add(mesh);
  const c = { id: data.id, type: data.type, mesh, contents: data.contents.slice(), pos: data.pos.slice() };
  crates.push(c);
  if (data.id >= nextCrateId) nextCrateId = data.id + 1;
  return c;
}
