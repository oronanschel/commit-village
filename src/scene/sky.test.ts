import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skyAt, viewerHour } from './sky';

test('midnight is dark, noon is bright', () => {
  assert.equal(skyAt(0).daylight, 0);
  assert.equal(skyAt(12).daylight, 1);
  assert.ok(skyAt(0).sunElevation < -0.99);
  assert.ok(skyAt(12).sunElevation > 0.99);
});

test('dawn and dusk are twilight', () => {
  assert.ok(skyAt(6).twilight > 0.99);
  assert.ok(skyAt(18).twilight > 0.99);
  assert.equal(skyAt(12).twilight, 0);
});

test('sun rises in the east and sets in the west', () => {
  assert.ok(skyAt(7).sunDirection.x > 0);
  assert.ok(skyAt(17).sunDirection.x < 0);
});

test('hours wrap around', () => {
  assert.equal(skyAt(25).sunElevation.toFixed(6), skyAt(1).sunElevation.toFixed(6));
  assert.equal(skyAt(-1).sunElevation.toFixed(6), skyAt(23).sunElevation.toFixed(6));
});

test('viewerHour uses the local clock unless ?hour= overrides it', () => {
  const d = new Date(2026, 10, 5, 21, 30, 0);
  assert.equal(viewerHour(d, ''), 21.5);
  assert.equal(viewerHour(d, '?hour=9.25'), 9.25);
  assert.equal(viewerHour(d, '?hour=26'), 2);
  assert.equal(viewerHour(d, '?hour=abc'), 21.5);
  assert.equal(viewerHour(d, '?hour='), 21.5);
});
