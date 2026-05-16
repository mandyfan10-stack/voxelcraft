import * as THREE from 'three';
import { PLAYER_CONFIG, REACH_DISTANCE, CHUNK_SIZE, CHUNK_HEIGHT } from './config.js';
import { getBlockAt, genChunk } from './world.js';

export const player = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: -.1, onG: false, dead: false };
export const mobs = [];
export let closestMobDist = 999;

function getTex(hexColor, noiseLevel = 0.12) {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const base = new THREE.Color(hexColor);
  const hsl = { h: 0, s: 0, l: 0 }; 
  base.getHSL(hsl);
  
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const n = (Math.random() - 0.5) * noiseLevel;
      const c = new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + n)));
      ctx.fillStyle = '#' + c.getHexString();
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter; 
  tex.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: tex });
}

export function checkCollision(pos, r = PLAYER_CONFIG.radius, h = PLAYER_CONFIG.height) {
  const eps = 0.001; 
  for (let x = Math.floor(pos.x - r + eps); x <= Math.floor(pos.x + r - eps); x++)
    for (let y = Math.floor(pos.y); y <= Math.floor(pos.y + h - eps); y++)
      for (let z = Math.floor(pos.z - r + eps); z <= Math.floor(pos.z + r - eps); z++)
        if (getBlockAt(x, y, z) > 0) return true;
  return false;
}

export function groundY(x, z) {
  let y = CHUNK_HEIGHT - 1;
  while (y > 1 && !getBlockAt(Math.round(x), y, Math.round(z))) y--;
  return y + .02;
}

export function raycast(camera) {
  const eye = new THREE.Vector3(player.pos.x, player.pos.y + PLAYER_CONFIG.eyeHeight, player.pos.z);
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
  for (let i = 0; i < REACH_DISTANCE * 3; i++) {
    if (getBlockAt(x, y, z) > 0) return { hit: [x, y, z], prev };
    prev = [x, y, z];
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) { x += stepX; tMaxX += tDeltaX; } else { z += stepZ; tMaxZ += tDeltaZ; }
    } else {
      if (tMaxY < tMaxZ) { y += stepY; tMaxY += tDeltaY; } else { z += stepZ; tMaxZ += tDeltaZ; }
    }
  }
  return null;
}

function createBoxMesh(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

const M_FLESH = getTex(0xdfa890);
const M_SHIRT = getTex(0x4a5b2c);
const M_FUR = getTex(0xeeeeee);
const M_EARS = getTex(0xffb6c1);
const M_FACE = getTex(0xf5c3a9);
const M_EYE = new THREE.MeshLambertMaterial({color: 0xffffff});
const M_PUPIL = new THREE.MeshLambertMaterial({color: 0x000000});

export function makeTroll() {
  const g = new THREE.Group();
  const body = createBoxMesh(1.4, 1.2, 1.4, M_SHIRT); body.position.y = 0.6; g.add(body);
  const head = createBoxMesh(0.8, 0.8, 0.8, M_FLESH); head.position.set(0, 1.6, 0.2); g.add(head);

  const le = createBoxMesh(0.3, 0.3, 0.3, M_EYE); le.position.set(-0.25, 1.8, 0.6);
  const lp = createBoxMesh(0.1, 0.1, 0.1, M_PUPIL); lp.position.set(-0.25, 1.8, 0.76);
  const re = createBoxMesh(0.3, 0.3, 0.3, M_EYE); re.position.set(0.25, 1.8, 0.6);
  const rp = createBoxMesh(0.1, 0.1, 0.1, M_PUPIL); rp.position.set(0.25, 1.8, 0.76);
  
  const hair = createBoxMesh(1.0, 0.3, 0.9, getTex(0x221100)); hair.position.set(0, 2.05, 0.1);

  g.add(le, lp, re, rp, hair);
  g.userData = { h: 2.0, r: 0.7 };
  return g;
}

export function makeRabbitMan() {
  const g = new THREE.Group();
  const body = createBoxMesh(1.8, 1.6, 1.8, M_FUR); body.position.y = 0.8; g.add(body);
  const face = createBoxMesh(0.7, 0.5, 0.1, M_FACE); face.position.set(0, 1.2, 0.95); g.add(face);
  
  const le = createBoxMesh(0.2, 0.8, 0.1, M_FUR); le.position.set(-0.3, 2.0, 0.8);
  const leIn = createBoxMesh(0.1, 0.6, 0.11, M_EARS); leIn.position.set(-0.3, 2.0, 0.81);
  const re = createBoxMesh(0.2, 0.8, 0.1, M_FUR); re.position.set(0.3, 2.0, 0.8);
  const reIn = createBoxMesh(0.1, 0.6, 0.11, M_EARS); reIn.position.set(0.3, 2.0, 0.81);

  g.add(le, leIn, re, reIn);
  g.userData = { h: 1.6, r: 0.9 };
  return g;
}

export function spawnMobs(scene) {
  const defs = [ 
    { x: player.pos.x + 15, z: player.pos.z + 10, mk: makeTroll, spd: 3.5, type: 'troll' },
    { x: player.pos.x - 15, z: player.pos.z - 15, mk: makeRabbitMan, spd: 4.8, type: 'rabbit' }
  ];

  for (const d of defs) {
    const mob = d.mk();
    mob.userData = Object.assign(mob.userData || {}, {vy: 0, spd: d.spd, type: d.type, onG: false});
    genChunk(Math.floor(d.x / CHUNK_SIZE), Math.floor(d.z / CHUNK_SIZE));
    mob.position.set(d.x, groundY(d.x, d.z) + 3, d.z);
    scene.add(mob); mobs.push(mob);
  }
}

export function resetGame() {
  player.dead = false;
  player.pos.set(0, groundY(0,0) + 15, 0);
  player.vel.set(0, 0, 0);
  player.yaw = 0;
  player.pitch = -.1;
  
  const skull = document.getElementById('skull');
  const emoji = document.getElementById('skullemoji');
  
  if (skull) skull.style.display = 'none';
  if (emoji) {
    emoji.style.fontSize = '0px';
    emoji.style.animation = 'none';
  }

  try {
    if (mobs.length >= 2) {
      mobs[0].position.set(player.pos.x + 15, groundY(player.pos.x + 15, player.pos.z + 10) + 5, player.pos.z + 10);
      mobs[1].position.set(player.pos.x - 15, groundY(player.pos.x - 15, player.pos.z - 15) + 5, player.pos.z - 15);
    }
  } catch (e) { console.error("Mob reset:", e); }
}

function triggerDeath() {
  if (player.dead) return;
  player.dead = true;
  
  if (document.pointerLockElement) {
    document.exitPointerLock(); 
  }
  
  const skull = document.getElementById('skull');
  const emoji = document.getElementById('skullemoji');
  
  if (skull) {
    skull.style.display = 'flex';
    skull.style.background = 'rgba(0,0,0,0.8)';
  }
  
  if (emoji) {
    requestAnimationFrame(() => {
      emoji.style.fontSize = '300px';
      emoji.style.animation = 'skullpulse 0.5s infinite';
    });
  }

  setTimeout(resetGame, 3500);
}

const tMobPos = new THREE.Vector3();
const tMobStep = new THREE.Vector3();

export function updateMobs(dt) {
  closestMobDist = 999;
  const cx = player.pos.x, cz = player.pos.z;

  for (const m of mobs) {
    const d = m.userData;
    
    d.vy -= PLAYER_CONFIG.gravity * dt; 
    d.onG = false;

    const moveMobAxis = (axis, amt) => {
      if (!amt) return;
      const s = Math.sign(amt); let rem = amt;
      while (Math.abs(rem) > 1e-4) {
        const step = Math.min(Math.abs(rem), 0.05) * s;
        tMobPos.copy(m.position); tMobPos[axis] += step;

        if (!checkCollision(tMobPos, d.r, d.h)) {
            m.position.copy(tMobPos); rem -= step; continue;
        }
        
        if (axis !== 'y' && d.onG) {
          tMobStep.copy(tMobPos); tMobStep.y += 1.02;
          if (!checkCollision(tMobStep, d.r, d.h)) {
              m.position.copy(tMobStep); rem -= step; continue;
          }
        }
        
        if (axis === 'y') {
            if (s < 0) d.onG = true; 
            d.vy = 0;
        }
        break;
      }
    };

    moveMobAxis('y', d.vy * dt);

    if (!player.dead) {
      const dx = cx - m.position.x;
      const dz = cz - m.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      closestMobDist = Math.min(closestMobDist, dist);
      
      if (dist > 1.0 && dist < 40) {
        moveMobAxis('x', (dx / dist) * d.spd * dt);
        moveMobAxis('z', (dz / dist) * d.spd * dt);
        m.rotation.y = Math.atan2(dx, dz);
      }

      if (dist < (d.r + PLAYER_CONFIG.radius + 0.2) && Math.abs(player.pos.y - m.position.y) < d.h) {
        triggerDeath();
      }
    }
  }
}
