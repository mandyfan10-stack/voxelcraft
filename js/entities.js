import * as THREE from './vendor/three.module.js';
import { PLAYER_CONFIG, REACH_DISTANCE, CHUNK_SIZE, CHUNK_HEIGHT,
         MOB_DAMAGE_PER_SEC, PLAYER_MAX_HP, HP_REGEN_RATE, COMBAT_COOLDOWN, MAX_MOBS,
         STAMINA_MAX, HUNGER_MAX,
         MOB_MAX_HP, MELEE_RANGE, MELEE_DAMAGE, MELEE_COOLDOWN } from './config.js';
import { getBlockAt, genChunk } from './world.js';
import { cycle } from './daynight.js';

export const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  yaw: 0, pitch: -.1, onG: false, dead: false,
  hp: PLAYER_MAX_HP,
  stamina: STAMINA_MAX,
  hunger: HUNGER_MAX,
  lastDamageTime: -999,
  lastSprintTime: -999,
  lastMeleeTime:  -999,
};

export const mobs = [];
export let closestMobDist = 999;

let _scene = null;
let gameTime = 0;

// ── Procedural texture helper ────────────────────────────────────────────────

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

// ── Materials ────────────────────────────────────────────────────────────────

const M_FLESH   = getTex(0xc8896a, 0.18);
const M_SHIRT   = getTex(0x2d3318, 0.10);
const M_FAT     = getTex(0xbf7a55, 0.22);
const M_FUR     = getTex(0xe8e8e4, 0.08);
const M_SKIN    = getTex(0xf2c4a0, 0.15);
const M_EAR     = getTex(0xc07858, 0.20);
const M_HAIR    = getTex(0x0f0808, 0.05);
const M_EYE_W   = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
const M_EYE_B   = new THREE.MeshLambertMaterial({ color: 0x0a0a08 });
const M_EYE_R   = new THREE.MeshLambertMaterial({ color: 0xcc2200 });
const M_TOOTH   = new THREE.MeshLambertMaterial({ color: 0xd4c87a });
const M_GUMS    = new THREE.MeshLambertMaterial({ color: 0x882244 });
const M_INNER   = new THREE.MeshLambertMaterial({ color: 0xffaaaa });

function mesh(geo, mat) { return new THREE.Mesh(geo, mat); }

// ── Grotesque Troll ──────────────────────────────────────────────────────────

export function makeTroll() {
  const g = new THREE.Group();

  // Massive fat torso
  const torso = mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.6, 8), M_SHIRT);
  torso.position.y = 0.8;
  torso.scale.set(1.6, 1.0, 1.3);
  g.add(torso);

  // Belly overhang — droops forward
  const belly = mesh(new THREE.SphereGeometry(0.85, 8, 6), M_FAT);
  belly.position.set(0, 0.55, 0.35);
  belly.scale.set(1.5, 0.9, 1.2);
  g.add(belly);

  // Neck fat rolls
  const roll1 = mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.22, 8), M_FAT);
  roll1.position.set(0, 1.62, 0);
  roll1.scale.set(1.3, 1.0, 1.1);
  g.add(roll1);
  const roll2 = mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.18, 8), M_FAT);
  roll2.position.set(0, 1.82, 0);
  roll2.scale.set(1.15, 1.0, 1.0);
  g.add(roll2);

  // Wide flat head
  const head = mesh(new THREE.SphereGeometry(0.58, 8, 6), M_FLESH);
  head.position.set(0, 2.18, 0.1);
  head.scale.set(1.45, 1.0, 1.2);
  g.add(head);

  // Left eye — bulging straight
  const eyeGeo = new THREE.SphereGeometry(0.18, 7, 5);
  const lEye = mesh(eyeGeo, M_EYE_W);
  lEye.position.set(-0.28, 2.30, 0.58);
  lEye.scale.set(1.0, 1.15, 1.4);
  g.add(lEye);
  const lPupil = mesh(new THREE.SphereGeometry(0.09, 6, 4), M_EYE_B);
  lPupil.position.set(-0.28, 2.30, 0.75);
  g.add(lPupil);
  // Bloodshot ring
  const irisL = mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.03, 12), M_EYE_R);
  irisL.rotation.x = Math.PI / 2;
  irisL.position.set(-0.28, 2.30, 0.56);
  g.add(irisL);

  // Right eye — wall-eyed (pupil shifted outward)
  const rEye = mesh(eyeGeo, M_EYE_W);
  rEye.position.set(0.32, 2.28, 0.52);
  rEye.scale.set(1.0, 1.1, 1.3);
  g.add(rEye);
  const rPupil = mesh(new THREE.SphereGeometry(0.09, 6, 4), M_EYE_B);
  rPupil.position.set(0.42, 2.28, 0.68);
  g.add(rPupil);
  const irisR = mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.03, 12), M_EYE_R);
  irisR.rotation.x = Math.PI / 2;
  irisR.position.set(0.32, 2.28, 0.50);
  g.add(irisR);

  // Enormous grinning mouth
  const mouthHole = mesh(new THREE.BoxGeometry(0.82, 0.20, 0.12), M_GUMS);
  mouthHole.position.set(0, 2.00, 0.63);
  g.add(mouthHole);

  // Upper teeth — 6 uneven stubs
  const toothX  = [-0.32, -0.20, -0.08, 0.08, 0.20, 0.35];
  const toothH  = [ 0.16,  0.22,  0.12, 0.18, 0.20, 0.14];
  const toothRz = [ 0.08, -0.05,  0.06,-0.07, 0.05,-0.06];
  for (let i = 0; i < toothX.length; i++) {
    const t = mesh(new THREE.BoxGeometry(0.09, toothH[i], 0.09), M_TOOTH);
    t.position.set(toothX[i], 2.02 + toothH[i] * 0.3, 0.67);
    t.rotation.z = toothRz[i];
    g.add(t);
  }
  // Lower teeth — 4 shorter
  const lToothX = [-0.28, -0.08, 0.12, 0.30];
  const lToothRz = [-0.05, 0.04, -0.04, 0.05];
  for (let i = 0; i < lToothX.length; i++) {
    const t = mesh(new THREE.BoxGeometry(0.08, 0.10, 0.08), M_TOOTH);
    t.position.set(lToothX[i], 1.94, 0.67);
    t.rotation.z = lToothRz[i];
    g.add(t);
  }

  // One enormous ear (right side)
  const bigEar = mesh(new THREE.SphereGeometry(0.32, 7, 5), M_EAR);
  bigEar.position.set(0.84, 2.18, 0);
  bigEar.scale.set(0.6, 1.2, 0.5);
  g.add(bigEar);
  const bigEarInner = mesh(new THREE.SphereGeometry(0.16, 6, 4), M_INNER);
  bigEarInner.position.set(0.90, 2.18, 0.05);
  bigEarInner.scale.set(0.4, 0.8, 0.3);
  g.add(bigEarInner);

  // Tiny left ear nub
  const smallEar = mesh(new THREE.SphereGeometry(0.10, 5, 4), M_EAR);
  smallEar.position.set(-0.65, 2.18, -0.05);
  g.add(smallEar);

  // Stringy hair strands
  const hairGeo = new THREE.BoxGeometry(0.10, 0.55, 0.04);
  const hairPts = [[-0.30,2.55,0.10],[-0.15,2.58,0.05],[0,2.60,0],[0.15,2.57,0.08],[0.28,2.54,0.12],[-0.38,2.50,-0.05],[0.35,2.50,-0.05]];
  for (const [hx, hy, hz] of hairPts) {
    const s = mesh(hairGeo, M_HAIR);
    s.position.set(hx, hy, hz);
    s.rotation.x = 0.15;
    s.rotation.z = hx < 0 ? -0.10 : 0.10;
    g.add(s);
  }

  // Vestigial arms — tiny stubs
  const armGeo = new THREE.CylinderGeometry(0.10, 0.08, 0.45, 6);
  const lArm = mesh(armGeo, M_FLESH);
  lArm.position.set(-1.12, 1.10, 0.10);
  lArm.rotation.z = 0.8; lArm.rotation.x = 0.3;
  g.add(lArm);
  const rArm = mesh(armGeo, M_FLESH);
  rArm.position.set(1.12, 1.10, 0.10);
  rArm.rotation.z = -0.8; rArm.rotation.x = 0.3;
  g.add(rArm);

  // Stubby legs
  const legGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.55, 7);
  g.add(Object.assign(mesh(legGeo, M_SHIRT), { position: new THREE.Vector3(-0.38, 0.28, 0.05) }));
  g.add(Object.assign(mesh(legGeo, M_SHIRT), { position: new THREE.Vector3( 0.38, 0.28, 0.05) }));

  g.userData = { h: 2.5, r: 0.85 };
  return g;
}

// ── Grotesque RabbitMan ──────────────────────────────────────────────────────

export function makeRabbitMan() {
  const g = new THREE.Group();

  // Dominant near-perfect white sphere body
  const body = mesh(new THREE.SphereGeometry(1.05, 10, 8), M_FUR);
  body.position.y = 1.05;
  g.add(body);

  // Tiny human face EMBEDDED in the front of the sphere
  const faceBase = mesh(new THREE.SphereGeometry(0.30, 7, 5), M_SKIN);
  faceBase.position.set(0, 1.05, 1.00);
  faceBase.scale.set(1.0, 0.80, 0.35);
  g.add(faceBase);

  // Beady eyes with sclera
  const beadGeo = new THREE.SphereGeometry(0.055, 6, 5);
  const scleraGeo = new THREE.SphereGeometry(0.075, 6, 5);
  for (const sx of [-0.10, 0.10]) {
    const sc = mesh(scleraGeo, M_EYE_W);
    sc.position.set(sx, 1.12, 1.06);
    g.add(sc);
    const pupil = mesh(beadGeo, M_EYE_B);
    pupil.position.set(sx, 1.12, 1.09);
    g.add(pupil);
  }

  // Nose and mouth slit
  const nose = mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), M_GUMS);
  nose.position.set(0, 1.04, 1.10);
  g.add(nose);
  const mouth = mesh(new THREE.BoxGeometry(0.18, 0.03, 0.04), M_GUMS);
  mouth.position.set(0, 0.96, 1.09);
  g.add(mouth);

  // Long bunny ears
  const earGeo   = new THREE.CylinderGeometry(0.08, 0.10, 0.90, 7);
  const innerGeo  = new THREE.CylinderGeometry(0.04, 0.05, 0.75, 6);
  const earData = [[-0.22, 2.25, -0.15, -0.10, 0.08], [0.22, 2.25, -0.15, 0.12, 0.05]];
  for (const [ex, ey, ez, rz, rx] of earData) {
    const e = mesh(earGeo, M_FUR);
    e.position.set(ex, ey, ez); e.rotation.z = rz; e.rotation.x = rx;
    g.add(e);
    const ei = mesh(innerGeo, M_INNER);
    ei.position.set(ex, ey, ez + 0.02); ei.rotation.z = rz; ei.rotation.x = rx;
    g.add(ei);
  }

  // Comically tiny stub feet
  const footGeo = new THREE.BoxGeometry(0.22, 0.12, 0.32);
  for (const fx of [-0.30, 0.30]) {
    const f = mesh(footGeo, M_FUR);
    f.position.set(fx, 0.06, 0.25);
    g.add(f);
  }

  g.userData = { h: 2.2, r: 1.05 };
  return g;
}

// ── Physics helpers ──────────────────────────────────────────────────────────

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
  const tDX = stepX !== 0 ? Math.abs(1/dir.x) : Infinity;
  const tDY = stepY !== 0 ? Math.abs(1/dir.y) : Infinity;
  const tDZ = stepZ !== 0 ? Math.abs(1/dir.z) : Infinity;
  let tMaxX = stepX > 0 ? (x+1-eye.x)*tDX : (eye.x-x)*tDX;
  let tMaxY = stepY > 0 ? (y+1-eye.y)*tDY : (eye.y-y)*tDY;
  let tMaxZ = stepZ > 0 ? (z+1-eye.z)*tDZ : (eye.z-z)*tDZ;
  let prev = null;
  for (let i = 0; i < REACH_DISTANCE * 3; i++) {
    if (getBlockAt(x, y, z) > 0) return { hit: [x, y, z], prev };
    prev = [x, y, z];
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) { x += stepX; tMaxX += tDX; } else { z += stepZ; tMaxZ += tDZ; }
    } else {
      if (tMaxY < tMaxZ) { y += stepY; tMaxY += tDY; } else { z += stepZ; tMaxZ += tDZ; }
    }
  }
  return null;
}

// ── Mob spawning ─────────────────────────────────────────────────────────────

export function spawnMobs(scene) {
  _scene = scene;
  const defs = [
    { x: player.pos.x + 15, z: player.pos.z + 10, mk: makeTroll,    spd: 3.5, type: 'troll'  },
    { x: player.pos.x - 15, z: player.pos.z - 15, mk: makeRabbitMan, spd: 4.8, type: 'rabbit' },
  ];
  for (const d of defs) {
    const mob = d.mk();
    mob.userData = Object.assign(mob.userData || {}, { vy: 0, spd: d.spd, type: d.type, onG: false, hp: MOB_MAX_HP, dead: false });
    genChunk(Math.floor(d.x / CHUNK_SIZE), Math.floor(d.z / CHUNK_SIZE));
    mob.position.set(d.x, groundY(d.x, d.z) + 3, d.z);
    scene.add(mob);
    mobs.push(mob);
  }
}

export function spawnHordeMob(scene) {
  if (mobs.length >= MAX_MOBS) return;
  const isTroll = Math.random() > 0.4;
  const angle = Math.random() * Math.PI * 2;
  const dist  = 25 + Math.random() * 15;
  const sx = player.pos.x + Math.cos(angle) * dist;
  const sz = player.pos.z + Math.sin(angle) * dist;
  const mob = isTroll ? makeTroll() : makeRabbitMan();
  mob.userData = Object.assign(mob.userData || {}, {
    vy: 0, spd: isTroll ? 3.5 : 4.8, type: isTroll ? 'troll' : 'rabbit', onG: false, hp: MOB_MAX_HP, dead: false,
  });
  genChunk(Math.floor(sx / CHUNK_SIZE), Math.floor(sz / CHUNK_SIZE));
  mob.position.set(sx, groundY(sx, sz) + 3, sz);
  scene.add(mob);
  mobs.push(mob);
}

// ── Melee attack ─────────────────────────────────────────────────────────────

export function meleeAttack() {
  if (player.dead || (gameTime - player.lastMeleeTime) < MELEE_COOLDOWN) return false;
  player.lastMeleeTime = gameTime;
  const ex = player.pos.x, ey = player.pos.y + PLAYER_CONFIG.eyeHeight, ez = player.pos.z;
  const fwx = -Math.sin(player.yaw) * Math.cos(player.pitch);
  const fwy =  Math.sin(player.pitch);
  const fwz = -Math.cos(player.yaw) * Math.cos(player.pitch);
  let hit = false;
  for (const m of mobs) {
    if (m.userData.dead) continue;
    const dx = m.position.x - ex, dy = m.position.y - ey, dz = m.position.z - ez;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < MELEE_RANGE) {
      const dot = (fwx * dx + fwy * dy + fwz * dz) / dist;
      if (dot > 0.45) {
        m.userData.hp -= MELEE_DAMAGE;
        if (m.userData.hp <= 0) m.userData.dead = true;
        hit = true;
      }
    }
  }
  return hit;
}

// ── Mob radar blips ───────────────────────────────────────────────────────────

export function getMobBlips() {
  const RADAR_RANGE = 64;
  return mobs.filter(m => !m.userData.dead).map(m => {
    const dx = m.position.x - player.pos.x;
    const dz = m.position.z - player.pos.z;
    const dist = Math.hypot(dx, dz);
    const worldAngleDeg = Math.atan2(dx, dz) * (180 / Math.PI);
    const relAngle = ((worldAngleDeg - player.yaw * (180 / Math.PI)) + 720) % 360;
    return {
      angle: relAngle,
      dist: Math.min(1, dist / RADAR_RANGE),
      kind: m.userData.type === 'troll' ? 'T' : 'R',
    };
  });
}

// ── Death & Reset ─────────────────────────────────────────────────────────────

export function resetGame() {
  player.dead = false;
  player.hp   = PLAYER_MAX_HP;
  player.lastDamageTime = -999;
  player.pos.set(0, groundY(0,0) + 3, 0);
  player.vel.set(0, 0, 0);
  player.yaw = 0; player.pitch = -.1;

  const skull = document.getElementById('skull');
  const emoji = document.getElementById('skullemoji');
  if (skull) skull.style.display = 'none';
  if (emoji) { emoji.style.fontSize = '0px'; emoji.style.animation = 'none'; }

  // Remove horde mobs, keep only initial 2
  if (_scene) {
    while (mobs.length > 2) {
      const m = mobs.pop();
      _scene.remove(m);
    }
  }
  try {
    if (mobs.length >= 2) {
      mobs[0].position.set(player.pos.x + 15, groundY(player.pos.x + 15, player.pos.z + 10) + 5, player.pos.z + 10);
      mobs[1].position.set(player.pos.x - 15, groundY(player.pos.x - 15, player.pos.z - 15) + 5, player.pos.z - 15);
    }
  } catch (e) { console.error('Mob reset:', e); }
}

function triggerDeath() {
  if (player.dead) return;
  player.dead = true;
  if (document.pointerLockElement) document.exitPointerLock();
  window.GameBridge?.emit('death');
}

// ── Mob update ───────────────────────────────────────────────────────────────

const tMobPos  = new THREE.Vector3();
const tMobStep = new THREE.Vector3();

export function updateMobs(dt) {
  gameTime += dt;
  // Remove dead mobs from scene
  for (let i = mobs.length - 1; i >= 0; i--) {
    if (mobs[i].userData.dead) {
      if (_scene) _scene.remove(mobs[i]);
      mobs.splice(i, 1);
    }
  }

  closestMobDist = 999;
  let inCombat = false;
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
        if (!checkCollision(tMobPos, d.r, d.h)) { m.position.copy(tMobPos); rem -= step; continue; }
        if (axis !== 'y' && d.onG) {
          tMobStep.copy(tMobPos); tMobStep.y += 1.02;
          if (!checkCollision(tMobStep, d.r, d.h)) { m.position.copy(tMobStep); rem -= step; continue; }
        }
        if (axis === 'y') { if (s < 0) d.onG = true; d.vy = 0; }
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
        const spd = d.spd * cycle.speedMult;
        moveMobAxis('x', (dx / dist) * spd * dt);
        moveMobAxis('z', (dz / dist) * spd * dt);
        m.rotation.y = Math.atan2(dx, dz);
      }

      if (dist < (d.r + PLAYER_CONFIG.radius + 0.2) && Math.abs(player.pos.y - m.position.y) < d.h) {
        player.hp -= MOB_DAMAGE_PER_SEC * dt;
        player.lastDamageTime = gameTime;
        inCombat = true;
        if (player.hp <= 0) { player.hp = 0; triggerDeath(); }
      }
    }
  }

  // HP regen when out of combat
  if (!inCombat && !player.dead && (gameTime - player.lastDamageTime) > COMBAT_COOLDOWN) {
    player.hp = Math.min(PLAYER_MAX_HP, player.hp + HP_REGEN_RATE * dt);
  }
}
