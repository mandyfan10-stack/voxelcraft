import { test } from 'node:test';
import assert from 'node:assert/strict';
import { xpForLevel, levelForXp, playerState, addXp, resetPlayerState } from '../js/playerstate.js';

test('xpForLevel(1) is 0 and is monotonically increasing', () => {
  assert.equal(xpForLevel(1), 0);
  let prev = 0;
  for (let lvl = 2; lvl <= 20; lvl++) {
    const x = xpForLevel(lvl);
    assert.ok(x > prev, 'level ' + lvl + ' XP ' + x + ' must exceed ' + prev);
    prev = x;
  }
});

test('levelForXp(0) is 1, and inverts xpForLevel at thresholds', () => {
  assert.equal(levelForXp(0), 1);
  for (let lvl = 1; lvl <= 10; lvl++) {
    const need = xpForLevel(lvl);
    assert.equal(levelForXp(need), lvl);
    if (lvl > 1) assert.equal(levelForXp(need - 1), lvl - 1);
  }
});

test('addXp grants levels and increases maxHp + perks', () => {
  resetPlayerState();
  assert.equal(playerState.level, 1);
  const enoughForLvl3 = xpForLevel(3);
  const gained = addXp(enoughForLvl3);
  assert.ok(gained >= 1, 'should level up at least once');
  assert.equal(playerState.level, 3);
  assert.ok(playerState.maxHp > 100, 'maxHp must grow with levels');
  assert.ok(playerState.perks.miningSpeed > 1);
  assert.ok(playerState.perks.meleeDmg > 1);
});

test('addXp(0) is a no-op', () => {
  resetPlayerState();
  assert.equal(addXp(0), 0);
  assert.equal(playerState.xp, 0);
  assert.equal(playerState.level, 1);
});

test('resetPlayerState clears all progression', () => {
  addXp(500);
  resetPlayerState();
  assert.equal(playerState.xp, 0);
  assert.equal(playerState.level, 1);
  assert.equal(playerState.maxHp, 100);
  assert.equal(playerState.stats.kills, 0);
  assert.equal(playerState.inventory.slots.length, playerState.inventory.size);
});
