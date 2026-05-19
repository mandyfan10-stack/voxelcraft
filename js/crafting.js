// js/crafting.js — Crafting recipes. Pure logic, no Three.js/React (unit-testable).
//
// A recipe: { name, out:{id,count}, inputs:[{id,count}] }

export const RECIPES = [
  { name: 'Wooden Sticks',  out: { id: 'wood_stick', count: 4 },    inputs: [{ id: 'wood', count: 1 }] },
  { name: 'Cloth',          out: { id: 'cloth', count: 1 },         inputs: [{ id: 'plant_fiber', count: 4 }] },
  { name: 'Bandage',        out: { id: 'bandage', count: 1 },       inputs: [{ id: 'cloth', count: 2 }] },
  { name: 'Wooden Pickaxe', out: { id: 'wood_pickaxe', count: 1 },  inputs: [{ id: 'wood', count: 2 }, { id: 'wood_stick', count: 2 }] },
  { name: 'Wooden Club',    out: { id: 'wood_club', count: 1 },     inputs: [{ id: 'wood', count: 2 }, { id: 'wood_stick', count: 1 }] },
  { name: 'Stone Pickaxe',  out: { id: 'stone_pickaxe', count: 1 }, inputs: [{ id: 'stone', count: 3 }, { id: 'wood_stick', count: 2 }] },
  { name: 'Stone Axe',      out: { id: 'stone_axe', count: 1 },     inputs: [{ id: 'stone', count: 3 }, { id: 'wood_stick', count: 2 }] },
  { name: 'Cooked Meat',    out: { id: 'cooked_meat', count: 1 },   inputs: [{ id: 'raw_meat', count: 1 }] },
  { name: 'Water Jar',      out: { id: 'water_jar', count: 1 },     inputs: [{ id: 'murky_water', count: 1 }, { id: 'cloth', count: 1 }] },
  { name: 'Concrete Block', out: { id: 'concrete', count: 4 },      inputs: [{ id: 'stone', count: 4 }, { id: 'sand', count: 2 }] },
  { name: 'Iron Sword',     out: { id: 'iron_sword', count: 1 },    inputs: [{ id: 'scrap_iron', count: 5 }, { id: 'wood_stick', count: 1 }] },
  { name: 'Spiked Bat',     out: { id: 'spiked_bat', count: 1 },    inputs: [{ id: 'wood_club', count: 1 }, { id: 'scrap_iron', count: 3 }, { id: 'bone', count: 4 }] },
];

// Does `inv` (an Inventory) hold every input for `recipe`?
export function canCraft(inv, recipe) {
  if (!inv || !recipe) return false;
  return recipe.inputs.every(inp => inv.count(inp.id) >= inp.count);
}

// Consume the inputs and add the output. Returns true on success.
export function doCraft(inv, recipe) {
  if (!canCraft(inv, recipe)) return false;
  for (const inp of recipe.inputs) {
    let need = inp.count;
    for (let i = 0; i < inv.size && need > 0; i++) {
      const s = inv.slots[i];
      if (s && s.id === inp.id) need -= inv.removeAt(i, need);
    }
  }
  inv.add(recipe.out.id, recipe.out.count);
  return true;
}
