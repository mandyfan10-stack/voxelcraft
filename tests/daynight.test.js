import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cycle, updateCycle } from '../js/daynight.js';
import { DAY_DURATION, BLOOD_MOON_INTERVAL } from '../js/config.js';

// Fresh cycle reset — module state is shared so each test re-zeroes it.
function resetCycle() {
  cycle.time = 0; cycle.dayCount = 1;
  cycle.isNight = false; cycle.isBloodMoon = false;
  cycle.bloodMoonWave = 0; cycle.frac = 0; cycle.speedMult = 1.0;
}

test('cycle wraps and advances dayCount on night→day boundary', () => {
  resetCycle();
  let calls = 0;
  // Advance one full DAY_DURATION; isNight must toggle and dayCount tick.
  for (let t = 0; t < DAY_DURATION + 1; t += 0.5) updateCycle(0.5, () => calls++);
  assert.equal(cycle.dayCount, 2, 'dayCount after one day cycle');
});

test('blood moon only fires on dayCount % 7 === 0', () => {
  resetCycle();
  const bmDays = new Set();
  for (let t = 0; t < DAY_DURATION * 9; t += 1) {
    updateCycle(1, (info) => { if (info.bloodMoon) bmDays.add(cycle.dayCount); });
  }
  assert.deepEqual([...bmDays], [BLOOD_MOON_INTERVAL]);
});

test('blood moon waves escalate through the night', () => {
  resetCycle();
  const waves = [];
  for (let t = 0; t < DAY_DURATION * 8; t += 1) {
    updateCycle(1, (info) => { if (info.bloodMoon) waves.push(info.count); });
  }
  assert.ok(waves.length > 1, 'expected multiple blood-moon waves');
  // Wave counts should be non-decreasing-then-capped.
  assert.ok(waves[waves.length - 1] >= waves[0]);
});

test('normal nights fire single-zombie horde callbacks', () => {
  resetCycle();
  const normalCounts = [];
  for (let t = 0; t < DAY_DURATION * 2; t += 1) {
    updateCycle(1, (info) => { if (!info.bloodMoon) normalCounts.push(info.count); });
  }
  assert.ok(normalCounts.length > 0);
  for (const c of normalCounts) assert.equal(c, 1);
});
