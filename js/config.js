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

// Sprint / Stamina
export const SPRINT_SPEED_MULT    = 1.75;
export const STAMINA_MAX          = 100;
export const STAMINA_SPRINT_DRAIN = 30;   // per sec
export const STAMINA_REGEN_RATE   = 12;   // per sec
export const STAMINA_REGEN_DELAY  = 1.5;  // sec before regen starts

// Hunger
export const HUNGER_MAX           = 100;
export const HUNGER_DRAIN_RATE    = 1.0;  // per sec
export const HUNGER_STARVATION_DMG = 5;   // HP/sec when hunger = 0

// Combat
export const MOB_MAX_HP           = 60;
export const MELEE_RANGE          = 2.8;
export const MELEE_DAMAGE         = 35;
export const MELEE_COOLDOWN       = 0.55; // sec between swings

// Thirst
export const THIRST_MAX             = 100;
export const THIRST_DRAIN_RATE      = 0.7;  // per sec
export const THIRST_DEHYDRATION_DMG = 4;    // HP/sec when thirst = 0

// Blood moon — every 7th night a large escalating horde besieges the player.
export const BLOOD_MOON_INTERVAL = 7;   // day count multiple
export const BLOOD_MOON_PULSE    = 13;  // sec between horde pulses
export const BLOOD_MOON_PER_PULSE = 3;  // zombies spawned per pulse
export const BLOOD_MOON_MAX_MOBS = 30;  // mob cap during a blood moon

// Mining — block hardness, indexed by block id (0 = air). Higher = slower to mine.
// Water (7) is effectively unmineable.
export const BLOCK_HARDNESS = [0, 1.0, 1.0, 3.2, 1.7, 1.2, 0.5, 999, 1.5, 4.2];
export const HAND_MINE_SPEED = 1.0;     // base mining speed with no tool
