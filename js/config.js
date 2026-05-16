export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 22;
export const REACH_DISTANCE = 5;

export const PLAYER_CONFIG = {
  radius: 0.34,
  height: 1.8,
  eyeHeight: 1.62,
  speed: 5.5,
  accelerationGround: 28,
  accelerationAir: 8,
  jumpForce: 7.8,
  gravity: 22
};

export const BLOCK_COLORS = [
  0,          // air
  0x4a6b2a,   // grass — асфальтово-зелёный
  0x5c3d1e,   // dirt — грязно-коричневый
  0x6b6b6b,   // stone — выветренный серый
  0x5c3d1e,   // bark
  0xb8a87a,   // sand/gravel — пыльный
  0x3d5c20,   // leaves — мёртвые
  0x1a3355,   // water — мутная
  0xd0d8d0,   // snow/ash — серая
  0x7a7a7a    // concrete rubble
];

// Day/Night cycle
export const DAY_DURATION      = 300;
export const NIGHT_START_FRAC  = 0.55;
export const DAWN_START_FRAC   = 0.85;

// Combat
export const MOB_DAMAGE_PER_SEC = 20;
export const PLAYER_MAX_HP      = 100;
export const HP_REGEN_RATE      = 5;
export const COMBAT_COOLDOWN    = 5;

// Horde
export const HORDE_INTERVAL    = 90;
export const MAX_MOBS          = 8;
export const NIGHT_SPEED_MULT  = 1.8;
