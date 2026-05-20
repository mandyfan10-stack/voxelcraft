import { DAY_DURATION, NIGHT_START_FRAC, DAWN_START_FRAC, HORDE_INTERVAL,
         BLOOD_MOON_INTERVAL, BLOOD_MOON_PULSE, BLOOD_MOON_PER_PULSE } from './config.js';

export const cycle = {
  time: 0,
  dayCount: 1,
  isNight: false,
  isBloodMoon: false,
  bloodMoonWave: 0,
  frac: 0,
  speedMult: 1.0,
};

let hordeAccum = 0;

// `onHorde` receives { bloodMoon, count, wave } — main.js translates to spawns.
export function updateCycle(dt, onHorde) {
  cycle.time = (cycle.time + dt) % DAY_DURATION;
  cycle.frac = cycle.time / DAY_DURATION;

  const wasNight = cycle.isNight;
  cycle.isNight = cycle.frac >= NIGHT_START_FRAC && cycle.frac < DAWN_START_FRAC;
  if (wasNight && !cycle.isNight) cycle.dayCount++;
  cycle.isBloodMoon = cycle.isNight && (cycle.dayCount % BLOOD_MOON_INTERVAL === 0);
  cycle.speedMult = cycle.isNight ? 1.8 : 1.0;

  if (cycle.isNight) {
    hordeAccum += dt;
    if (cycle.isBloodMoon) {
      if (hordeAccum >= BLOOD_MOON_PULSE) {
        hordeAccum = 0;
        cycle.bloodMoonWave++;
        // Wave size escalates as the night progresses.
        const elapsed = (cycle.frac - NIGHT_START_FRAC) / (DAWN_START_FRAC - NIGHT_START_FRAC);
        const ramp = 1 + Math.floor(elapsed * 4);
        const count = Math.min(8, BLOOD_MOON_PER_PULSE + ramp);
        onHorde({ bloodMoon: true, count, wave: cycle.bloodMoonWave });
      }
    } else if (hordeAccum >= HORDE_INTERVAL) {
      hordeAccum = 0;
      onHorde({ bloodMoon: false, count: 1, wave: 0 });
    }
  } else {
    hordeAccum = 0;
    cycle.bloodMoonWave = 0;
  }
}

export function getAtmosphere() {
  const f = cycle.frac;

  if (f < NIGHT_START_FRAC) {
    const t = f / NIGHT_START_FRAC;
    const pulse = Math.sin(t * Math.PI);
    return {
      skyColor: lerpColor(0x4a5c28, 0x7a8a4a, pulse),
      fogColor: lerpColor(0x4a5c28, 0x7a8a4a, pulse),
      fogNear: 22, fogFar: 55,
      ambientSky: 0x8fa055, ambientGround: 0x4a3a25,
      ambientIntensity: 0.9,
      sunIntensity: 0.75,
      sunColor: 0xffe8b0,
    };
  } else if (f < DAWN_START_FRAC) {
    const duskLen = 0.10;
    const nightT = Math.min(1, (f - NIGHT_START_FRAC) / duskLen);
    return {
      skyColor:  lerpColor(0x4a5c28, 0x050508, nightT),
      fogColor:  lerpColor(0x4a5c28, 0x1a0005, nightT),
      fogNear: lerp(22, 8,  nightT),
      fogFar:  lerp(55, 28, nightT),
      ambientSky: lerpColor(0x8fa055, 0x1a0a1a, nightT),
      ambientGround: lerpColor(0x4a3a25, 0x050205, nightT),
      ambientIntensity: lerp(0.9, 0.20, nightT),
      sunIntensity: lerp(0.75, 0.0, nightT),
      sunColor: 0x2233aa,
    };
  } else {
    const dawnT = (f - DAWN_START_FRAC) / (1.0 - DAWN_START_FRAC);
    return {
      skyColor:  lerpColor(0x1a0005, 0x4a5c28, dawnT),
      fogColor:  lerpColor(0x1a0005, 0x4a5c28, dawnT),
      fogNear: lerp(8,  22, dawnT),
      fogFar:  lerp(28, 55, dawnT),
      ambientSky: lerpColor(0x1a0a1a, 0x8fa055, dawnT),
      ambientGround: lerpColor(0x050205, 0x4a3a25, dawnT),
      ambientIntensity: lerp(0.20, 0.9, dawnT),
      sunIntensity: lerp(0.0, 0.75, dawnT),
      sunColor: lerpColor(0x2233aa, 0xffe8b0, dawnT),
    };
  }
}

export function getSunDirection(frac) {
  const angle = frac * Math.PI * 2 - Math.PI * 0.5;
  return { x: Math.cos(angle) * 40, y: Math.sin(angle) * 40, z: 10 };
}

function lerpColor(hexA, hexB, t) {
  const ar = (hexA >> 16) & 0xff, ag = (hexA >> 8) & 0xff, ab = hexA & 0xff;
  const br = (hexB >> 16) & 0xff, bg = (hexB >> 8) & 0xff, bb = hexB & 0xff;
  return ((Math.round(ar + (br - ar) * t) << 16) |
          (Math.round(ag + (bg - ag) * t) << 8)  |
           Math.round(ab + (bb - ab) * t));
}

function lerp(a, b, t) { return a + (b - a) * t; }
