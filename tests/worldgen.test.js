import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVoxelIndex, getChunkKey, chunkSeed, mulberry32, heightAt } from '../js/worldgen.js';
import { CHUNK_SIZE, CHUNK_HEIGHT } from '../js/config.js';

test('getVoxelIndex is a unique, bounded mapping', () => {
  const seen = new Set();
  for (let x = 0; x < CHUNK_SIZE; x++)
    for (let y = 0; y < CHUNK_HEIGHT; y++)
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const idx = getVoxelIndex(x, y, z);
        assert.ok(idx >= 0 && idx < CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
        assert.ok(!seen.has(idx), 'collision at ' + x + ',' + y + ',' + z);
        seen.add(idx);
      }
  assert.equal(seen.size, CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
});

test('getChunkKey is deterministic and direction-aware', () => {
  assert.equal(getChunkKey(3, -2), '3,-2');
  assert.notEqual(getChunkKey(1, 2), getChunkKey(2, 1));
});

test('chunkSeed returns the same value for the same input', () => {
  assert.equal(chunkSeed(5, 7), chunkSeed(5, 7));
  assert.notEqual(chunkSeed(5, 7), chunkSeed(7, 5));
});

test('mulberry32 produces a uniform-ish stream in [0, 1)', () => {
  const rng = mulberry32(12345);
  let min = 1, max = 0, sum = 0;
  const n = 2000;
  for (let i = 0; i < n; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / n;
  assert.ok(min < 0.05, 'min ' + min);
  assert.ok(max > 0.95, 'max ' + max);
  assert.ok(Math.abs(mean - 0.5) < 0.05, 'mean ' + mean);
});

test('heightAt is deterministic and inside the playable Y range', () => {
  for (let x = -100; x < 100; x += 7)
    for (let z = -100; z < 100; z += 11) {
      const h = heightAt(x, z);
      assert.ok(h >= 2 && h <= CHUNK_HEIGHT - 3, 'h=' + h + ' at ' + x + ',' + z);
      assert.equal(h, heightAt(x, z), 'non-deterministic at ' + x + ',' + z);
    }
});
