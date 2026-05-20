import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOOT_TABLES, rollLoot } from '../js/loot.js';

// Deterministic RNG for reproducible tests.
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

test('LOOT_TABLES has the three crate types', () => {
  for (const k of ['cabinet', 'toolbox', 'ammoCrate']) {
    assert.ok(Array.isArray(LOOT_TABLES[k]) && LOOT_TABLES[k].length > 0, k + ' missing');
  }
});

test('every loot entry has positive weight and a sane range', () => {
  for (const [k, table] of Object.entries(LOOT_TABLES)) {
    for (const e of table) {
      assert.ok(typeof e.id === 'string' && e.id.length > 0, k);
      assert.ok(e.weight > 0, k + ' weight');
      assert.ok(e.min > 0 && e.max >= e.min, k + ' min/max');
    }
  }
});

test('rollLoot returns 2-4 entries (per tableKey)', () => {
  const rng = seededRng(42);
  for (let i = 0; i < 100; i++) {
    const r = rollLoot('cabinet', rng);
    assert.ok(r.length >= 2 && r.length <= 4, 'got ' + r.length);
  }
});

test('rollLoot is deterministic with the same RNG', () => {
  const a = rollLoot('toolbox', seededRng(123));
  const b = rollLoot('toolbox', seededRng(123));
  assert.deepEqual(a, b);
});

test('rollLoot returns empty for unknown tables', () => {
  assert.deepEqual(rollLoot('not_a_table'), []);
});

test('rolled items reference valid ids from the table', () => {
  const rng = seededRng(7);
  for (let i = 0; i < 50; i++) {
    const r = rollLoot('ammoCrate', rng);
    for (const item of r) {
      assert.ok(LOOT_TABLES.ammoCrate.find(e => e.id === item.id), 'unknown id: ' + item.id);
      assert.ok(item.count > 0);
    }
  }
});
