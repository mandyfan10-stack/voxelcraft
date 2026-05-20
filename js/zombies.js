// js/zombies.js — Procedural zombie meshes + per-type stats. Imports Three.js.

import * as THREE from './vendor/three.module.js';

// Procedural noisy texture (same approach as the original creature code).
function getTex(hexColor, noiseLevel = 0.14) {
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
const M_FLESH    = getTex(0x7c8a55, 0.20);   // rotted green-grey flesh
const M_FLESH_D  = getTex(0x59633a, 0.16);
const M_WOUND    = getTex(0x8a4334, 0.22);   // exposed wound
const M_RAGS     = getTex(0x2e2a1e, 0.12);   // torn dark clothing
const M_RAGS_2   = getTex(0x3d3322, 0.12);
const M_PALE     = getTex(0xb3ab93, 0.14);   // screamer pale skin
const M_ARMOR    = getTex(0x232a36, 0.08);   // brute riot armor
const M_ARMOR_L  = getTex(0x3a4351, 0.08);
const M_BONE     = new THREE.MeshLambertMaterial({ color: 0xc8c0a0 });
const M_EYE      = new THREE.MeshLambertMaterial({ color: 0xd9e0b0 });
const M_EYE_GLOW = new THREE.MeshLambertMaterial({ color: 0xffe066 });
const M_PUPIL    = new THREE.MeshLambertMaterial({ color: 0x0a0a08 });
const M_MOUTH    = new THREE.MeshLambertMaterial({ color: 0x240707 });
const M_TOOTH    = new THREE.MeshLambertMaterial({ color: 0xbfb487 });
const M_VISOR    = new THREE.MeshLambertMaterial({ color: 0x0a0d12 });

function mesh(geo, mat) { return new THREE.Mesh(geo, mat); }

// Sunken zombie eyes (socket + eyeball + pupil) added to group `g`.
function addEyes(g, y, z, sp, glow) {
  for (const sx of [-sp, sp]) {
    const socket = mesh(new THREE.SphereGeometry(0.085, 6, 5), M_MOUTH);
    socket.position.set(sx, y, z - 0.03);
    g.add(socket);
    const eye = mesh(new THREE.SphereGeometry(0.05, 6, 5), glow ? M_EYE_GLOW : M_EYE);
    eye.position.set(sx, y, z + 0.03);
    g.add(eye);
    const pup = mesh(new THREE.SphereGeometry(0.022, 5, 4), M_PUPIL);
    pup.position.set(sx, y, z + 0.07);
    g.add(pup);
  }
}

// ── Walker — the standard shambling zombie ──────────────────────────────────
export function makeWalker() {
  const g = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.13, 0.1, 0.86, 6);
  const lLeg = mesh(legGeo, M_RAGS);   lLeg.position.set(-0.16, 0.43, 0);    g.add(lLeg);
  const rLeg = mesh(legGeo, M_RAGS_2); rLeg.position.set(0.17, 0.43, 0.02);  g.add(rLeg);

  const torso = mesh(new THREE.CylinderGeometry(0.33, 0.43, 0.92, 8), M_RAGS);
  torso.position.set(0, 1.16, 0.04); torso.rotation.x = 0.2;
  g.add(torso);
  const belly = mesh(new THREE.SphereGeometry(0.3, 8, 6), M_WOUND);
  belly.position.set(0.05, 1.05, 0.22); belly.scale.set(1.0, 0.75, 0.6);
  g.add(belly);

  const head = mesh(new THREE.SphereGeometry(0.31, 8, 7), M_FLESH);
  head.position.set(0.04, 1.82, 0.14); head.scale.set(0.95, 1.08, 1.0);
  head.rotation.z = 0.18;
  g.add(head);
  addEyes(g, 1.86, 0.42, 0.12, false);
  const jaw = mesh(new THREE.BoxGeometry(0.2, 0.13, 0.12), M_MOUTH);
  jaw.position.set(0.04, 1.67, 0.36);
  g.add(jaw);

  const armGeo = new THREE.CylinderGeometry(0.085, 0.07, 0.72, 6);
  const lArm = mesh(armGeo, M_FLESH);   lArm.position.set(-0.36, 1.42, 0.34); lArm.rotation.x = -1.35; g.add(lArm);
  const rArm = mesh(armGeo, M_FLESH_D); rArm.position.set(0.4, 1.2, 0.04);    rArm.rotation.z = -0.22; g.add(rArm);
  return g;
}

// ── Runner — lean, fast, comes at night ─────────────────────────────────────
export function makeRunner() {
  const g = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.82, 6);
  const lLeg = mesh(legGeo, M_FLESH);   lLeg.position.set(-0.14, 0.4, 0.12);  lLeg.rotation.x = -0.4; g.add(lLeg);
  const rLeg = mesh(legGeo, M_FLESH_D); rLeg.position.set(0.15, 0.42, -0.12); rLeg.rotation.x = 0.5;  g.add(rLeg);

  const torso = mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.8, 8), M_FLESH);
  torso.position.set(0, 1.02, 0.16); torso.rotation.x = 0.6;
  g.add(torso);
  const wound = mesh(new THREE.SphereGeometry(0.17, 7, 5), M_WOUND);
  wound.position.set(-0.1, 1.1, 0.36);
  g.add(wound);

  const head = mesh(new THREE.SphereGeometry(0.26, 8, 6), M_FLESH);
  head.position.set(0, 1.36, 0.5); head.scale.set(0.95, 0.92, 1.05);
  g.add(head);
  addEyes(g, 1.4, 0.74, 0.1, false);
  const jaw = mesh(new THREE.BoxGeometry(0.2, 0.14, 0.1), M_MOUTH);
  jaw.position.set(0, 1.24, 0.66);
  g.add(jaw);
  for (const tx of [-0.06, 0.06]) {
    const t = mesh(new THREE.BoxGeometry(0.05, 0.07, 0.05), M_TOOTH);
    t.position.set(tx, 1.28, 0.7);
    g.add(t);
  }

  const armGeo = new THREE.CylinderGeometry(0.07, 0.055, 0.66, 6);
  const lArm = mesh(armGeo, M_FLESH_D); lArm.position.set(-0.28, 1.06, -0.16); lArm.rotation.x = 1.1; g.add(lArm);
  const rArm = mesh(armGeo, M_FLESH_D); rArm.position.set(0.28, 1.06, -0.16);  rArm.rotation.x = 1.1; g.add(rArm);
  return g;
}

// ── Brute — armored riot-cop tank ───────────────────────────────────────────
export function makeBrute() {
  const g = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.2, 0.17, 0.95, 7);
  const lLeg = mesh(legGeo, M_ARMOR); lLeg.position.set(-0.26, 0.48, 0); g.add(lLeg);
  const rLeg = mesh(legGeo, M_ARMOR); rLeg.position.set(0.26, 0.48, 0);  g.add(rLeg);

  const torso = mesh(new THREE.BoxGeometry(1.0, 1.0, 0.66), M_ARMOR);
  torso.position.set(0, 1.42, 0);
  g.add(torso);
  const plate = mesh(new THREE.BoxGeometry(0.7, 0.6, 0.12), M_ARMOR_L);
  plate.position.set(0, 1.5, 0.34);
  g.add(plate);
  for (const sx of [-0.62, 0.62]) {
    const sh = mesh(new THREE.SphereGeometry(0.34, 7, 6), M_ARMOR_L);
    sh.position.set(sx, 1.78, 0); sh.scale.set(1, 0.85, 1);
    g.add(sh);
  }

  const head = mesh(new THREE.SphereGeometry(0.34, 8, 7), M_FLESH);
  head.position.set(0, 2.18, 0.04);
  g.add(head);
  const helmet = mesh(new THREE.SphereGeometry(0.37, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), M_ARMOR);
  helmet.position.set(0, 2.2, 0.04);
  g.add(helmet);
  const visor = mesh(new THREE.BoxGeometry(0.5, 0.13, 0.08), M_VISOR);
  visor.position.set(0, 2.16, 0.34);
  g.add(visor);
  addEyes(g, 2.16, 0.36, 0.13, true);

  const armGeo = new THREE.CylinderGeometry(0.16, 0.13, 1.0, 6);
  const lArm = mesh(armGeo, M_FLESH); lArm.position.set(-0.72, 1.32, 0.08); lArm.rotation.z = 0.25;  g.add(lArm);
  const rArm = mesh(armGeo, M_FLESH); rArm.position.set(0.72, 1.32, 0.08);  rArm.rotation.z = -0.25; g.add(rArm);
  for (const fx of [-0.84, 0.84]) {
    const fist = mesh(new THREE.SphereGeometry(0.2, 6, 5), M_FLESH_D);
    fist.position.set(fx, 0.86, 0.12);
    g.add(fist);
  }
  return g;
}

// ── Screamer — gaunt, summons more zombies ──────────────────────────────────
export function makeScreamer() {
  const g = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.08, 0.06, 1.0, 6);
  const lLeg = mesh(legGeo, M_PALE); lLeg.position.set(-0.13, 0.5, 0); g.add(lLeg);
  const rLeg = mesh(legGeo, M_PALE); rLeg.position.set(0.13, 0.5, 0);  g.add(rLeg);

  const torso = mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.95, 8), M_PALE);
  torso.position.set(0, 1.5, 0);
  g.add(torso);
  for (let i = 0; i < 3; i++) {
    const rib = mesh(new THREE.TorusGeometry(0.2, 0.03, 4, 8, Math.PI), M_BONE);
    rib.position.set(0, 1.3 + i * 0.22, 0.16); rib.rotation.x = Math.PI / 2;
    g.add(rib);
  }

  const head = mesh(new THREE.SphereGeometry(0.3, 8, 7), M_PALE);
  head.position.set(0, 2.12, -0.04); head.scale.set(0.92, 1.2, 0.95);
  head.rotation.x = -0.35;
  g.add(head);
  addEyes(g, 2.22, 0.22, 0.1, true);
  const mouth = mesh(new THREE.SphereGeometry(0.2, 8, 7), M_MOUTH);
  mouth.position.set(0, 1.98, 0.16); mouth.scale.set(0.8, 1.4, 0.8);
  g.add(mouth);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const t = mesh(new THREE.ConeGeometry(0.035, 0.12, 4), M_TOOTH);
    t.position.set(Math.cos(a) * 0.14, 1.98 + Math.sin(a) * 0.2, 0.28);
    g.add(t);
  }

  const armGeo = new THREE.CylinderGeometry(0.055, 0.04, 1.1, 6);
  const lArm = mesh(armGeo, M_PALE); lArm.position.set(-0.32, 1.4, 0); lArm.rotation.z = 0.35;  g.add(lArm);
  const rArm = mesh(armGeo, M_PALE); rArm.position.set(0.32, 1.4, 0);  rArm.rotation.z = -0.35; g.add(rArm);
  return g;
}

// ── Type table — drives spawning, AI and combat ─────────────────────────────
export const ZOMBIE_TYPES = {
  walker:   { build: makeWalker,   spd: 1.9, nightSpd: 2.4, hp: 55,  dmg: 16, xp: 10, r: 0.42, h: 1.95, blip: 'W' },
  runner:   { build: makeRunner,   spd: 2.6, nightSpd: 6.2, hp: 40,  dmg: 13, xp: 16, r: 0.38, h: 1.75, blip: 'R' },
  brute:    { build: makeBrute,    spd: 1.6, nightSpd: 2.0, hp: 220, dmg: 36, xp: 45, r: 0.62, h: 2.25, blip: 'B' },
  screamer: { build: makeScreamer, spd: 2.1, nightSpd: 2.7, hp: 70,  dmg: 11, xp: 26, r: 0.40, h: 2.05, blip: 'S' },
};
