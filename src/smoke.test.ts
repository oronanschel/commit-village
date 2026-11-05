import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

test('three imports under the test runner', () => {
  assert.equal(new THREE.Vector3(1, 2, 2).length(), 3);
});
