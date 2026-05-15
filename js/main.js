import * as THREE from 'three';
import { CHUNK, P } from './config.js';
import { worldData, chunkMeshes, dirtyChunks, ckey, genChunk, makeChunkMesh, sbw } from './world.js';
import { player, raycast, col, spawnMobs, updateMobs, closestMobDist, groundY, isDead } from './entities.js';

// Setup
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x5577aa);
scene.fog = new THREE.Fog(0x5577aa, 20, 58);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 100);
scene.add(new THREE.HemisphereLight(0xbbd4ff, 0x88aa66, 1.0));
const sun = new THREE.DirectionalLight(0xfff5dd, 0.85); sun.position.set(20, 40, 10); scene.add(sun);

// Input Setup
const keys = { w: 0, a: 0, s: 0, d: 0, j: 0 };
let selIdx = 0;
let locked = false;

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'w') keys.w = 1; else if (k === 'a') keys.a = 1; else if (k === 's') keys.s = 1; else if (k === 'd') keys.d = 1; else if (k === ' ') keys.j = 1;
  else if (k >= '1' && k <= '6') selIdx = +k - 1;
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'w') keys.w = 0; else if (k === 'a') keys.a = 0; else if (k === 's') keys.s = 0; else if (k === 'd') keys.d = 0; else if (k === ' ') keys.j = 0;
});

const cvs = document.getElementById('c');
cvs.addEventListener('click', () => cvs.requestPointerLock());
document.addEventListener('pointerlockchange', () => locked = document.pointerLockElement === cvs);

// ДОБАВЛЕНО: Блокировка движения мыши при смерти (!isDead)
document.addEventListener('mousemove', e => { 
  if (locked && !isDead) { 
    player.yaw -= e.movementX * .0022; 
    player.pitch = Math.max(-1.52, Math.min(1.52, player.pitch - e.movementY * .0021)); 
  } 
});

cvs.addEventListener('mousedown', e => {
  if (!locked || isDead) return;
  if (e.button === 0)
