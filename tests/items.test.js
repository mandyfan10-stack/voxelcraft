import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, getItem, dropForBlock, itemMeta } from '../js/items.js';

test('every item has id matching its registry key', () => {
  for (const k in ITEMS) assert.equal(ITEMS[k].id, k);
});

test('every item has the required fields', () => {
  for (const k in ITEMS) {
    const it = ITEMS[k];
    assert.ok(typeof it.name === 'string' && it.name.length > 0, k + ' name');
    assert.ok(typeof it.kind === 'string', k + ' kind');
    assert.ok(['block', 'tool', 'weapon', 'food', 'drink', 'material'].includes(it.category), k + ' category');
    assert.ok(typeof it.stack === 'number' && it.stack > 0, k + ' stack');
  }
});

test('placeable blocks declare blockId', () => {
  for (const k in ITEMS) {
    const it = ITEMS[k];
    if (it.place) assert.ok(typeof it.blockId === 'number', k + ' blockId');
  }
});

test('tools/weapons stack to 1 and have durability', () => {
  for (const k in ITEMS) {
    const it = ITEMS[k];
    if (it.category === 'tool' || it.category === 'weapon') {
      assert.equal(it.stack, 1, k + ' must stack to 1');
      assert.ok(it.durability && it.durability > 0, k + ' must have durability');
    }
  }
});

test('dropForBlock maps every world block id', () => {
  assert.equal(dropForBlock(2), 'dirt');
  assert.equal(dropForBlock(3), 'stone');
  assert.equal(dropForBlock(4), 'wood');
  assert.equal(dropForBlock(7), null);     // water — no drop
  assert.equal(dropForBlock(99), null);    // unknown id
});

test('itemMeta() is JSON-safe and has every id', () => {
  const m = itemMeta();
  const round = JSON.parse(JSON.stringify(m));
  for (const k in ITEMS) assert.ok(round[k], 'missing in meta: ' + k);
  assert.equal(round.wood_pickaxe.durability, 80);
});

test('getItem returns null on unknown id', () => {
  assert.equal(getItem('not_a_real_item'), null);
});
