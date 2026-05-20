import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Inventory, HOTBAR_SIZE, INV_SIZE } from '../js/inventory.js';

test('default size matches HOTBAR + storage', () => {
  const inv = new Inventory();
  assert.equal(inv.size, INV_SIZE);
  assert.ok(INV_SIZE > HOTBAR_SIZE);
  assert.equal(inv.slots.length, INV_SIZE);
});

test('add returns 0 leftover when it fits', () => {
  const inv = new Inventory();
  assert.equal(inv.add('wood', 10), 0);
  assert.equal(inv.count('wood'), 10);
});

test('add splits across stacks at max stack size', () => {
  const inv = new Inventory();
  inv.add('wood', 100);
  // wood stack = 64; 100 → 64 + 36 over two slots
  assert.equal(inv.count('wood'), 100);
  assert.equal(inv.slots[0].count, 64);
  assert.equal(inv.slots[1].count, 36);
});

test('add returns leftover when inventory is full', () => {
  const inv = new Inventory(2);
  inv.add('wood', 200);    // 64 + 64 = 128, leftover 72
  assert.equal(inv.count('wood'), 128);
  assert.equal(inv.add('wood', 10), 10);  // no room
});

test('tools get their durability stamped on add', () => {
  const inv = new Inventory();
  inv.add('wood_pickaxe', 1);
  assert.equal(inv.slots[0].id, 'wood_pickaxe');
  assert.equal(inv.slots[0].durability, 80);
});

test('removeAt clears a slot when count hits zero', () => {
  const inv = new Inventory();
  inv.add('stone', 5);
  assert.equal(inv.removeAt(0, 5), 5);
  assert.equal(inv.slots[0], null);
});

test('removeAt is bounded by the slot count', () => {
  const inv = new Inventory();
  inv.add('stone', 3);
  assert.equal(inv.removeAt(0, 99), 3);
  assert.equal(inv.slots[0], null);
});

test('move into an empty slot transfers the stack', () => {
  const inv = new Inventory();
  inv.add('wood', 5);
  inv.move(0, 10);
  assert.equal(inv.slots[0], null);
  assert.equal(inv.slots[10].id, 'wood');
  assert.equal(inv.slots[10].count, 5);
});

test('move into a same-id stack merges', () => {
  const inv = new Inventory();
  inv.slots[0] = { id: 'wood', count: 20 };
  inv.slots[5] = { id: 'wood', count: 30 };
  inv.move(0, 5);
  assert.equal(inv.slots[5].count, 50);
  assert.equal(inv.slots[0], null);
});

test('move into a same-id stack respects max stack', () => {
  const inv = new Inventory();
  inv.slots[0] = { id: 'wood', count: 50 };
  inv.slots[5] = { id: 'wood', count: 60 };
  inv.move(0, 5);
  assert.equal(inv.slots[5].count, 64);   // capped
  assert.equal(inv.slots[0].count, 46);   // remainder stays
});

test('move between different items swaps them', () => {
  const inv = new Inventory();
  inv.slots[0] = { id: 'wood', count: 5 };
  inv.slots[1] = { id: 'stone', count: 3 };
  inv.move(0, 1);
  assert.equal(inv.slots[0].id, 'stone');
  assert.equal(inv.slots[1].id, 'wood');
});

test('tools never merge — durability is unique', () => {
  const inv = new Inventory();
  inv.slots[0] = { id: 'wood_pickaxe', count: 1, durability: 40 };
  inv.slots[1] = { id: 'wood_pickaxe', count: 1, durability: 80 };
  inv.move(0, 1);
  // Should swap, not merge.
  assert.equal(inv.slots[0].durability, 80);
  assert.equal(inv.slots[1].durability, 40);
});

test('splitToEmpty moves half into first empty slot', () => {
  const inv = new Inventory();
  inv.add('wood', 30);
  inv.splitToEmpty(0);
  assert.equal(inv.slots[0].count, 15);
  assert.equal(inv.slots[1].count, 15);
});

test('serialize/deserialize round-trips', () => {
  const a = new Inventory();
  a.add('wood', 10);
  a.add('wood_pickaxe', 1);
  const data = a.serialize();
  const b = new Inventory();
  b.deserialize(data);
  assert.equal(b.count('wood'), 10);
  const pickIdx = b.findFirst('wood_pickaxe');
  assert.ok(pickIdx >= 0);
  assert.equal(b.slots[pickIdx].durability, 80);
});
