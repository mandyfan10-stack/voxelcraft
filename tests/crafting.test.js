import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Inventory } from '../js/inventory.js';
import { RECIPES, canCraft, doCraft } from '../js/crafting.js';

function recipeByName(name) {
  const r = RECIPES.find(x => x.name === name);
  assert.ok(r, 'recipe missing: ' + name);
  return r;
}

test('every recipe is well-formed', () => {
  for (const r of RECIPES) {
    assert.ok(typeof r.name === 'string' && r.name.length > 0);
    assert.ok(r.out && typeof r.out.id === 'string' && r.out.count > 0);
    assert.ok(Array.isArray(r.inputs) && r.inputs.length > 0);
    for (const inp of r.inputs) {
      assert.ok(typeof inp.id === 'string' && inp.count > 0);
    }
  }
});

test('canCraft is false when inputs missing', () => {
  const inv = new Inventory();
  const r = recipeByName('Wooden Pickaxe');
  assert.equal(canCraft(inv, r), false);
});

test('canCraft is true with sufficient inputs', () => {
  const inv = new Inventory();
  inv.add('wood', 2);
  inv.add('wood_stick', 2);
  const r = recipeByName('Wooden Pickaxe');
  assert.equal(canCraft(inv, r), true);
});

test('doCraft consumes inputs and produces output', () => {
  const inv = new Inventory();
  inv.add('wood', 5);
  inv.add('wood_stick', 4);
  const r = recipeByName('Wooden Pickaxe');
  assert.equal(doCraft(inv, r), true);
  assert.equal(inv.count('wood'), 3);
  assert.equal(inv.count('wood_stick'), 2);
  assert.equal(inv.count('wood_pickaxe'), 1);
});

test('doCraft fails (returns false) without inputs', () => {
  const inv = new Inventory();
  const r = recipeByName('Iron Sword');
  assert.equal(doCraft(inv, r), false);
  assert.equal(inv.count('iron_sword'), 0);
});

test('Wooden Sticks recipe converts 1 wood → 4 sticks', () => {
  const inv = new Inventory();
  inv.add('wood', 1);
  const r = recipeByName('Wooden Sticks');
  doCraft(inv, r);
  assert.equal(inv.count('wood'), 0);
  assert.equal(inv.count('wood_stick'), 4);
});

test('Concrete Block recipe outputs 4 blocks', () => {
  const inv = new Inventory();
  inv.add('stone', 4);
  inv.add('sand', 2);
  doCraft(inv, recipeByName('Concrete Block'));
  assert.equal(inv.count('concrete'), 4);
});
