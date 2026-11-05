import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { HOUSE_STYLES, parseContributors, type Contributor } from './contributors';
import { MAX_RING, plotTransform, slotsInRing } from './plots';
import { buildVillage, createHouse } from './houses';

const example: Contributor = {
  id: 'test-person', name: 'Test person', kind: 'person',
  houseStyle: 'cottage', plot: { ring: 1, slot: 0 },
};

test('the shipped registry has distinct, valid people and agents', () => {
  const input = JSON.parse(readFileSync(new URL('../../public/contributors.json', import.meta.url), 'utf8'));
  const contributors = parseContributors(input);
  assert.ok(contributors.some(entry => entry.kind === 'person'));
  assert.ok(contributors.some(entry => entry.kind === 'agent'));
  assert.equal(new Set(contributors.map(entry => entry.id)).size, contributors.length);
});

test('registry rejects duplicate IDs, occupied plots and malformed records', () => {
  assert.throws(() => parseContributors({}), /array/);
  assert.throws(() => parseContributors([null]), /object/);
  assert.throws(() => parseContributors([example, example]), /duplicate id/);
  assert.throws(() => parseContributors([example, { ...example, id: 'another' }]), /already occupied/);
  for (const patch of [
    { id: 'UPPER' }, { name: ' ' }, { name: 'x'.repeat(49) }, { kind: 'robot' },
    { houseStyle: 'castle' }, { plot: { ring: 0, slot: 0 } },
    { plot: { ring: 1, slot: 8 } }, { plot: { ring: 1.5, slot: 0 } },
    { plot: { ring: 1, slot: NaN } }, { description: '<'.repeat(241) },
  ]) assert.throws(() => parseContributors([{ ...example, ...patch }]), /Contributor 1:/);
});

test('public text is preserved as text data, without introducing markup parsing', () => {
  const [parsed] = parseContributors([{ ...example, name: ' <script>alert(1)</script> ', description: '<b>hello</b>' }]);
  assert.equal(parsed.name, '<script>alert(1)</script>');
  assert.equal(parsed.description, '<b>hello</b>');
});

test('all supported plots face the fire and leave space between houses', () => {
  const points: THREE.Vector3[] = [];
  for (let ring = 1; ring <= MAX_RING; ring++) {
    for (let slot = 0; slot < slotsInRing(ring); slot++) {
      const transform = plotTransform({ ring, slot });
      const point = new THREE.Vector3(transform.x, 0, transform.z);
      const forward = new THREE.Vector3(Math.sin(transform.rotation), 0, Math.cos(transform.rotation));
      assert.ok(forward.dot(point.clone().normalize().negate()) > 0.999999);
      for (const previous of points) assert.ok(point.distanceTo(previous) > 7, 'house footprints must not overlap');
      points.push(point);
    }
  }
  assert.throws(() => slotsInRing(MAX_RING + 1), /ring/);
  assert.throws(() => plotTransform({ ring: 1, slot: -1 }), /slot/);
});

test('registry reordering never moves a house', () => {
  const people = [example, { ...example, id: 'second', plot: { ring: 2, slot: 3 } }];
  const positions = (entries: Contributor[]) => new Map(buildVillage(entries).children.map(house => [house.name, house.position.toArray()]));
  const first = positions(people);
  const reversed = positions([...people].reverse());
  for (const [name, point] of first) assert.deepEqual(reversed.get(name), point);
});

test('every original style builds finite geometry above ground with owner metadata', () => {
  for (const houseStyle of HOUSE_STYLES) {
    const owner = { ...example, houseStyle };
    const house = createHouse(owner);
    assert.equal(house.userData.contributor, owner);
    const bounds = new THREE.Box3().setFromObject(house);
    assert.ok(bounds.min.y >= -0.001);
    assert.ok(bounds.max.y < house.userData.labelHeight);
    assert.ok(bounds.max.x - bounds.min.x <= 5);
    house.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const position = object.geometry.getAttribute('position');
      for (let i = 0; i < position.array.length; i++) assert.ok(Number.isFinite(position.array[i]));
    });
  }
});
