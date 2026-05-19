// js/items.js — Item & block registry. Pure data, no Three.js/React (unit-testable).
//
// Each item:
//   { id, name, kind, category, stack, place?, blockId?, tool?, weapon?, durability?, restore? }
//   kind     — palette key for the <VoxelBlock> icon in ui/creature.jsx
//   category — 'block' | 'tool' | 'weapon' | 'food' | 'drink' | 'material'
//   place    — true if the item can be placed as a world block
//   blockId  — world voxel id placed (placeable items only)
//   tool     — { type:'pickaxe'|'axe', tier, speed }   speed multiplies mining rate
//   weapon   — { dmg }                                 melee damage when this item is active
//   restore  — { hunger?, thirst?, hp? }               applied on consume

const STACK_BLOCK = 64, STACK_MAT = 64, STACK_FOOD = 16, STACK_TOOL = 1;

export const ITEMS = {
  // ── Blocks (placeable) ────────────────────────────────────────────────
  dirt:     { name: 'Dirt Block',     kind: 'dirt',   category: 'block', stack: STACK_BLOCK, place: true, blockId: 2 },
  stone:    { name: 'Stone Block',    kind: 'stone',  category: 'block', stack: STACK_BLOCK, place: true, blockId: 3 },
  wood:     { name: 'Wood',           kind: 'wood',   category: 'block', stack: STACK_BLOCK, place: true, blockId: 4 },
  sand:     { name: 'Sand',           kind: 'sand',   category: 'block', stack: STACK_BLOCK, place: true, blockId: 5 },
  leaves:   { name: 'Leaves',         kind: 'leaves', category: 'block', stack: STACK_BLOCK, place: true, blockId: 6 },
  snow:     { name: 'Packed Snow',    kind: 'snow',   category: 'block', stack: STACK_BLOCK, place: true, blockId: 8 },
  concrete: { name: 'Concrete Block', kind: 'stone',  category: 'block', stack: STACK_BLOCK, place: true, blockId: 9 },

  // ── Materials ─────────────────────────────────────────────────────────
  wood_stick:  { name: 'Wooden Stick', kind: 'wood',   category: 'material', stack: STACK_MAT },
  plant_fiber: { name: 'Plant Fiber',  kind: 'leaves', category: 'material', stack: STACK_MAT },
  cloth:       { name: 'Cloth',        kind: 'leaves', category: 'material', stack: STACK_MAT },
  scrap_iron:  { name: 'Scrap Iron',   kind: 'metal',  category: 'material', stack: STACK_MAT },
  bone:        { name: 'Bone',         kind: 'bone',   category: 'material', stack: STACK_MAT },

  // ── Tools (pickaxe mines stone, axe mines wood) ───────────────────────
  wood_pickaxe:  { name: 'Wooden Pickaxe', kind: 'metal', category: 'tool', stack: STACK_TOOL, durability: 80,
                   tool: { type: 'pickaxe', tier: 1, speed: 2.6 }, weapon: { dmg: 14 } },
  stone_pickaxe: { name: 'Stone Pickaxe',  kind: 'metal', category: 'tool', stack: STACK_TOOL, durability: 180,
                   tool: { type: 'pickaxe', tier: 2, speed: 4.4 }, weapon: { dmg: 20 } },
  stone_axe:     { name: 'Stone Axe',      kind: 'metal', category: 'tool', stack: STACK_TOOL, durability: 180,
                   tool: { type: 'axe', tier: 2, speed: 4.4 }, weapon: { dmg: 26 } },

  // ── Weapons ───────────────────────────────────────────────────────────
  wood_club:  { name: 'Wooden Club', kind: 'wood',  category: 'weapon', stack: STACK_TOOL, durability: 120, weapon: { dmg: 32 } },
  iron_sword: { name: 'Iron Sword',  kind: 'metal', category: 'weapon', stack: STACK_TOOL, durability: 260, weapon: { dmg: 58 } },
  spiked_bat: { name: 'Spiked Bat',  kind: 'metal', category: 'weapon', stack: STACK_TOOL, durability: 200, weapon: { dmg: 78 } },

  // ── Food & drink ──────────────────────────────────────────────────────
  raw_meat:    { name: 'Raw Meat',       kind: 'flesh', category: 'food',  stack: STACK_FOOD, restore: { hunger: 14, hp: -4 } },
  cooked_meat: { name: 'Cooked Meat',    kind: 'flesh', category: 'food',  stack: STACK_FOOD, restore: { hunger: 42 } },
  berries:     { name: 'Forest Berries', kind: 'flesh', category: 'food',  stack: STACK_FOOD, restore: { hunger: 12, thirst: 6 } },
  canned_food: { name: 'Canned Food',    kind: 'metal', category: 'food',  stack: STACK_FOOD, restore: { hunger: 56 } },
  murky_water: { name: 'Murky Water',    kind: 'glass', category: 'drink', stack: STACK_FOOD, restore: { thirst: 24, hp: -3 } },
  water_jar:   { name: 'Water Jar',      kind: 'glass', category: 'drink', stack: STACK_FOOD, restore: { thirst: 46 } },
  bandage:     { name: 'Bandage',        kind: 'bone',  category: 'food',  stack: STACK_FOOD, restore: { hp: 28 } },
};

// Stamp each item with its own id for convenience.
for (const id in ITEMS) ITEMS[id].id = id;

export function getItem(id) { return ITEMS[id] || null; }

// World voxel id → dropped item id (null = nothing drops, e.g. water).
const BLOCK_DROPS = { 1: 'dirt', 2: 'dirt', 3: 'stone', 4: 'wood', 5: 'sand', 6: 'plant_fiber', 7: null, 8: 'snow', 9: 'stone' };
export function dropForBlock(blockId) { return BLOCK_DROPS[blockId] || null; }

// Compact, JSON-safe metadata for the React UI (pushed once over GameBridge).
export function itemMeta() {
  const meta = {};
  for (const id in ITEMS) {
    const it = ITEMS[id];
    meta[id] = {
      name: it.name, kind: it.kind, category: it.category,
      stack: it.stack, durability: it.durability || 0,
      restore: it.restore || null,
    };
  }
  return meta;
}
