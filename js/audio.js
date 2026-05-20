// js/audio.js — Web Audio API procedural SFX. Zero audio files (CSP-friendly).

let ctx = null;
let masterGain, sfxGain, musicGain, ambientGain;
const volumes = { master: 0.72, sfx: 0.70, music: 0.40, ambient: 0.55 };
let ambSource = null;
let unlocked = false;

function ensureCtx() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain  = ctx.createGain(); masterGain.gain.value  = volumes.master;
  sfxGain     = ctx.createGain(); sfxGain.gain.value     = volumes.sfx;
  musicGain   = ctx.createGain(); musicGain.gain.value   = volumes.music;
  ambientGain = ctx.createGain(); ambientGain.gain.value = 0; // ramped in via updateAmbient
  masterGain.connect(ctx.destination);
  sfxGain.connect(masterGain);
  musicGain.connect(masterGain);
  ambientGain.connect(masterGain);
  return ctx;
}

// Lazy unlock — call from a user gesture (canvas click, Start press).
export function unlockAudio() {
  ensureCtx();
  if (ctx.state === 'suspended') ctx.resume();
  unlocked = true;
}

// Register bridge listeners for gameplay events and settings.
export function initAudio() {
  const B = window.GameBridge;
  if (!B) return;
  B.on('hit',           () => playHit());
  B.on('kill',          () => playKill());
  B.on('scream',        () => playGrowl(true));
  B.on('drink',         () => playDrink());
  B.on('mine',          () => playMine());
  B.on('levelUp',       () => playLevelUp());
  B.on('bloodMoonStart',() => playSiren());

  B.on('audio:master',  (v) => { volumes.master  = clamp01(v / 100); if (masterGain)  masterGain.gain.value  = volumes.master;  });
  B.on('audio:sfx',     (v) => { volumes.sfx     = clamp01(v / 100); if (sfxGain)     sfxGain.gain.value     = volumes.sfx;     });
  B.on('audio:music',   (v) => { volumes.music   = clamp01(v / 100); if (musicGain)   musicGain.gain.value   = volumes.music;   });
  B.on('audio:ambient', (v) => { volumes.ambient = clamp01(v / 100); });
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// ── Building-block helpers ───────────────────────────────────────────────────

function noiseBurst(duration, freq, sweep, peak, bus) {
  if (!ctx || !unlocked) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass';
  filt.frequency.setValueAtTime(freq, ctx.currentTime);
  if (sweep) filt.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), ctx.currentTime + duration);
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(filt); filt.connect(g); g.connect(bus);
  src.start(); src.stop(ctx.currentTime + duration);
}

function tone(freq, duration, type, peak, bus, sweepTo) {
  if (!ctx || !unlocked) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (sweepTo !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), ctx.currentTime + duration);
  g.gain.setValueAtTime(peak, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  o.connect(g); g.connect(bus);
  o.start(); o.stop(ctx.currentTime + duration);
}

// ── SFX ──────────────────────────────────────────────────────────────────────

export function playMine() {
  if (!ctx || !unlocked) return;
  noiseBurst(0.10, 320, -180, 0.32, sfxGain);
  tone(220, 0.06, 'square', 0.10, sfxGain, 90);
}

export function playHit() {
  if (!ctx || !unlocked) return;
  noiseBurst(0.08, 900, -500, 0.4, sfxGain);
  tone(150, 0.09, 'square', 0.18, sfxGain, 70);
}

export function playKill() {
  if (!ctx || !unlocked) return;
  tone(80, 0.55, 'sawtooth', 0.30, sfxGain, 30);
  noiseBurst(0.35, 360, -260, 0.22, sfxGain);
}

export function playGrowl(loud) {
  if (!ctx || !unlocked) return;
  const dur = loud ? 1.2 : 0.55;
  const o = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.value = loud ? 78 : 110;
  lfo.frequency.value = 7;
  lfoGain.gain.value = 14;
  lfo.connect(lfoGain); lfoGain.connect(o.frequency);
  filt.type = 'lowpass'; filt.frequency.value = 420;
  g.gain.setValueAtTime(loud ? 0.55 : 0.25, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(filt); filt.connect(g); g.connect(sfxGain);
  o.start(); lfo.start();
  o.stop(ctx.currentTime + dur); lfo.stop(ctx.currentTime + dur);
}

export function playDrink() {
  if (!ctx || !unlocked) return;
  tone(420, 0.28, 'sine', 0.18, sfxGain, 200);
  noiseBurst(0.18, 1200, -700, 0.06, sfxGain);
}

export function playLevelUp() {
  if (!ctx || !unlocked) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 440 * Math.pow(1.5, i);
    g.gain.setValueAtTime(0.0, t + i * 0.1);
    g.gain.linearRampToValueAtTime(0.20, t + i * 0.1 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4);
    o.connect(g); g.connect(musicGain);
    o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.45);
  }
}

export function playSiren() {
  if (!ctx || !unlocked) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(660, t + 1);
  o.frequency.exponentialRampToValueAtTime(220, t + 2);
  o.frequency.exponentialRampToValueAtTime(660, t + 3);
  g.gain.setValueAtTime(0.32, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 3.3);
}

// ── Ambient drone (filtered noise, louder at night / blood moon) ────────────

export function startAmbient() {
  if (!ctx || !unlocked || ambSource) return;
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // Pseudo-pink noise — three running averages of white.
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99 * b0 + 0.04 * w;
    b1 = 0.96 * b1 + 0.16 * w;
    b2 = 0.86 * b2 + 0.20 * w;
    data[i] = (b0 + b1 + b2) * 0.3;
  }
  ambSource = ctx.createBufferSource();
  ambSource.buffer = buf;
  ambSource.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 260;
  ambSource.connect(filt);
  filt.connect(ambientGain);
  ambSource.start();
}

export function updateAmbient(isNight, isBloodMoon) {
  if (!ctx || !ambientGain) return;
  const target = (isBloodMoon ? 0.50 : isNight ? 0.32 : 0.08) * volumes.ambient;
  ambientGain.gain.setTargetAtTime(target, ctx.currentTime, 0.6);
}
