// js/loot.js — Loot tables + weighted rolls. Pure logic, no Three.js/React.

// Table entry: { id, weight, min, max }
export const LOOT_TABLES = {
  cabinet: [
    { id: 'canned_food', weight: 5, min: 1, max: 3 },
    { id: 'water_jar',   weight: 4, min: 1, max: 2 },
    { id: 'bandage',     weight: 3, min: 1, max: 2 },
    { id: 'cloth',       weight: 3, min: 1, max: 4 },
    { id: 'plant_fiber', weight: 4, min: 2, max: 5 },
    { id: 'scrap_iron',  weight: 2, min: 1, max: 2 },
    { id: 'wood_stick',  weight: 2, min: 2, max: 4 },
    { id: 'berries',     weight: 3, min: 1, max: 3 },
  ],
  toolbox: [
    { id: 'scrap_iron',    weight: 5, min: 2, max: 5 },
    { id: 'wood_pickaxe',  weight: 2, min: 1, max: 1 },
    { id: 'wood_club',     weight: 2, min: 1, max: 1 },
    { id: 'stone_pickaxe', weight: 1, min: 1, max: 1 },
    { id: 'wood_stick',    weight: 4, min: 2, max: 5 },
    { id: 'bone',          weight: 2, min: 1, max: 3 },
  ],
  ammoCrate: [
    { id: 'iron_sword', weight: 2, min: 1, max: 1 },
    { id: 'spiked_bat', weight: 1, min: 1, max: 1 },
    { id: 'scrap_iron', weight: 5, min: 3, max: 8 },
    { id: 'bone',       weight: 3, min: 2, max: 5 },
    { id: 'bandage',    weight: 3, min: 2, max: 4 },
    { id: 'cloth',      weight: 2, min: 2, max: 4 },
  ],
};

// Roll 2-4 weighted entries from the named table. `rand` is the RNG (Math.random by default).
export function rollLoot(tableKey, rand = Math.random) {
  const table = LOOT_TABLES[tableKey];
  if (!table) return [];
  const numEntries = 2 + Math.floor(rand() * 3);
  const totalWeight = table.reduce((s, e) => s + e.weight, 0);
  const result = [];
  for (let i = 0; i < numEntries; i++) {
    let w = rand() * totalWeight;
    for (const entry of table) {
      w -= entry.weight;
      if (w <= 0) {
        const span = entry.max - entry.min + 1;
        const count = entry.min + Math.floor(rand() * span);
        result.push({ id: entry.id, count });
        break;
      }
    }
  }
  return result;
}
