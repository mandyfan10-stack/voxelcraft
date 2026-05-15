import * as THREE from 'three';
import { P, REACH, CHUNK, CH } from './config.js';
import { gbw, genChunk } from './world.js';

export const player = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: -.1, onG: false };
export const mobs = [];
export let closestMobDist = 999;
export let isDead = false;

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

function b(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

export function makeTroll() {
  const g = new THREE.Group();
  const fleshMat = new THREE.MeshLambertMaterial({color: 0xdfa890});
  const shirtMat = new THREE.MeshLambertMaterial({color: 0x5a6b3c});
  const eyeMat = new THREE.MeshLambertMaterial({color: 0xffffff});
  const pupilMat = new THREE.MeshLambertMaterial({color: 0x000000});

  const body = b(1.4, 1.2, 1.4, shirtMat); body.position.y = 0.6; g.add(body);
  const head = b(0.8, 0.8, 0.8, fleshMat); head.position.set(0, 1.6, 0.2); g.add(head);

  const le = b(0.3, 0.3, 0.3, eyeMat); le.position.set(-0.25, 1.8, 0.6);
  const lp = b(0.1, 0.1, 0.1, pupilMat); lp.position.set(-0.25, 1.8, 0.76);
  const re = b(0.3, 0.3, 0.3, eyeMat); re.position.set(0.25, 1.8, 0.6);
  const rp = b(0.1, 0.1, 0.1, pupilMat); rp.position.set(0.25, 1.8, 0.76);
  g.add(le, lp, re, rp);

  g.userData = { h: 2.0, r: 0.7 };
  return g;
}

export function makeRabbitMan() {
  const g = new THREE.Group();
  const furMat = new THREE.MeshLambertMaterial({color: 0xeeeeee});
  const faceMat = new THREE.MeshLambertMaterial({color: 0xf5c3a9});
  const earMat = new THREE.MeshLambertMaterial({color: 0xffb6c1});

  const body = b(1.8, 1.6, 1.8, furMat); body.position.y = 0.8; g.add(body);
  const face = b(0.7, 0.5, 0.1, faceMat); face.position.set(0, 1.2, 0.95); g.add(face);
  const le = b(0.15, 0.7, 0.1, earMat); le.position.set(-0.3, 2.0, 0.8);
  const re = b(0.15, 0.7, 0.1, earMat); re.position.set(0.3, 2.0, 0.8);
  g.add(le, re);

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
    mob.userData = Object.assign(mob.userData || {}, {vy: 0, spd: d.spd, type: d.type});
    genChunk(Math.floor(d.x / CHUNK), Math.floor(d.z / CHUNK));
    mob.position.set(d.x, groundY(d.x, d.z) + 5, d.z);
    scene.add(mob); mobs.push(mob);
  }
}

// Система перезапуска
export function resetGame() {
  isDead = false;
  player.pos.set(0, groundY(0,0) + 2, 0);
  player.vel.set(0, 0, 0);
  player.yaw = 0;
  player.pitch = -.1;
  
  document.getElementById('skull').style.display = 'none';
  document.getElementById('skullemoji').style.fontSize = '0px';
  document.getElementById('skullemoji').style.animation = 'none';

  // Откидываем мобов обратно
  if (mobs.length >= 2) {
    mobs[0].position.set(player.pos.x + 15, groundY(player.pos.x + 15, player.pos.z + 10) + 5, player.pos.z + 10);
    mobs[1].position.set(player.pos.x - 15, groundY(player.pos.x - 15, player.pos.z - 15) + 5, player.pos.z - 15);
  }
}

function triggerDeath() {
  if (isDead) return;
  isDead = true;
  document.exitPointerLock(); 
  
  const skull = document.getElementById('skull');
  const emoji = document.getElementById('skullemoji');
  
  skull.style.display = 'flex';
  skull.style.background = 'rgba(0,0,0,0.8)';
  
  requestAnimationFrame(() => {
    emoji.style.fontSize = '300px';
    emoji.style.animation = 'skullpulse 0.5s infinite';
  });

  // Авто-воскрешение через 3.5 секунды
  setTimeout(resetGame, 3500);
}

export function updateMobs(dt) {
  closestMobDist = 999;
  const cx = player.pos.x, cz = player.pos.z;

  for (const m of mobs) {
    const d = m.userData;
    
    // Гравитация мобов работает всегда
    d.vy -= P.grav * dt; 
    m.position.y += d.vy * dt;
    
    const gy = groundY(m.position.x, m.position.z);
    if (m.position.y < gy) {
      m.position.y = gy;
      d.vy = 0;
    }

    // Мобы двигаются к игроку только если он жив
    if (!isDead) {
      const dx = cx - m.position.x;
      const dz = cz - m.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      closestMobDist = Math.min(closestMobDist, dist);
      
      if (dist > 1.0 && dist < 40) {
        m.position.x += (dx / dist) * d.spd * dt;
        m.position.z += (dz / dist) * d.spd * dt;
        m.rotation.y = Math.atan2(dx, dz);
      }

      if (dist < (d.r + P.r + 0.2) && Math.abs(player.pos.y - m.position.y) < d.h) {
        triggerDeath();
      }
    }
  }
}
