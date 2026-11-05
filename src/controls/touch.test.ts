import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isJoystickZone, joystickInput } from './touch';

test('pushing the thumb up walks forward, right strafes right', () => {
  const up = joystickInput(0, -56);
  assert.ok(Math.abs(up.forward - 1) < 1e-9);
  assert.ok(Math.abs(up.strafe) < 1e-9);
  const right = joystickInput(56, 0);
  assert.ok(Math.abs(right.strafe - 1) < 1e-9);
});

test('input is clamped to unit length beyond the joystick radius', () => {
  const far = joystickInput(300, -300);
  assert.ok(Math.hypot(far.forward, far.strafe) <= 1 + 1e-9);
});

test('small movements inside the dead zone are ignored', () => {
  assert.deepEqual(joystickInput(3, 2), { forward: 0, strafe: 0 });
  assert.deepEqual(joystickInput(0, 0), { forward: 0, strafe: 0 });
});

test('joystick zone is the lower-left of the screen', () => {
  assert.ok(isJoystickZone(50, 700, 400, 800));
  assert.ok(!isJoystickZone(300, 700, 400, 800));
  assert.ok(!isJoystickZone(50, 100, 400, 800));
});
