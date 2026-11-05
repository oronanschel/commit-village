import { test } from 'node:test';
import assert from 'node:assert/strict';
import { birdPosition, fireflyGlow, fireflyPosition } from './ambient';

test('fireflies stay near the ground inside the clearing', () => {
  for (let i = 0; i < 140; i++) {
    for (const t of [0, 3.3, 100, 5000]) {
      const p = fireflyPosition(i, t);
      assert.ok(p.y > 0 && p.y < 3, `firefly ${i} height ${p.y}`);
      assert.ok(Math.hypot(p.x, p.z) < 33, `firefly ${i} radius`);
    }
  }
});

test('firefly glow stays in [0, 1]', () => {
  for (let i = 0; i < 50; i++) {
    for (let t = 0; t < 10; t += 0.37) {
      const g = fireflyGlow(i, t);
      assert.ok(g >= 0 && g <= 1);
    }
  }
});

test('birds fly well above the houses', () => {
  for (let i = 0; i < 7; i++) {
    const p = birdPosition(i, 12.5);
    assert.ok(p.y > 18);
    assert.ok(Math.hypot(p.x, p.z) > 25);
  }
});

test('positions are deterministic', () => {
  assert.deepEqual(fireflyPosition(3, 7).toArray(), fireflyPosition(3, 7).toArray());
  assert.deepEqual(birdPosition(2, 7).toArray(), birdPosition(2, 7).toArray());
});
