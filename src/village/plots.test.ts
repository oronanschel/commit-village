import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { parseContributors } from './contributors';
import { createHouse } from './houses';
import { MAX_RING, PLOT_SIZE, plotTransform, slotsInRing, type Plot } from './plots';

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const land = read('../../village/plots.json') as { plotSize: number; plots: (Plot & { owner: string })[] };

function corners(plot: Plot): THREE.Vector2[] {
  const { x, z, rotation } = plotTransform(plot);
  const h = PLOT_SIZE / 2;
  return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([a, b]) =>
    new THREE.Vector2(a, b).rotateAround(new THREE.Vector2(), -rotation).add(new THREE.Vector2(x, z)));
}

/** Separating-axis test: touching edges are allowed, overlapping area is not. */
function overlap(a: THREE.Vector2[], b: THREE.Vector2[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const edge = poly[(i + 1) % 4].clone().sub(poly[i]);
      const axis = new THREE.Vector2(-edge.y, edge.x).normalize();
      const span = (p: THREE.Vector2[]) => p.map(v => v.dot(axis));
      const [pa, pb] = [span(a), span(b)];
      if (Math.max(...pa) <= Math.min(...pb) + 1e-6 || Math.max(...pb) <= Math.min(...pa) + 1e-6) return false;
    }
  }
  return true;
}

test('no two 12 × 12 m plots overlap, in any ring', () => {
  const all: THREE.Vector2[][] = [];
  for (let ring = 1; ring <= MAX_RING; ring++) {
    for (let slot = 0; slot < slotsInRing(ring); slot++) all.push(corners({ ring, slot }));
  }
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) assert.equal(overlap(all[i], all[j]), false, `plots ${i} and ${j}`);
  }
});

test('plots stay clear of the fire and inside the ground', () => {
  for (let ring = 1; ring <= MAX_RING; ring++) {
    for (let slot = 0; slot < slotsInRing(ring); slot++) {
      for (const c of corners({ ring, slot })) {
        assert.ok(c.length() > 12, 'clear of the campfire square');
        assert.ok(c.length() < 90, 'inside the ground disc');
      }
    }
  }
});

test('village/plots.json gives each member exactly one plot, matching contributors.json', () => {
  assert.equal(land.plotSize, PLOT_SIZE);
  const contributors = parseContributors(read('../../public/contributors.json'));
  const owners = land.plots.map(p => p.owner);
  assert.equal(new Set(owners).size, owners.length, 'one plot per member');
  assert.equal(new Set(land.plots.map(p => `${p.ring}:${p.slot}`)).size, land.plots.length, 'no shared plots');
  assert.deepEqual([...owners].sort(), contributors.map(c => c.id).sort());
  for (const c of contributors) {
    const claim = land.plots.find(p => p.owner === c.id)!;
    assert.deepEqual({ ring: claim.ring, slot: claim.slot }, c.plot, `${c.id} builds on their own plot`);
  }
});

test('every house style fits inside its plot', () => {
  for (const c of parseContributors(read('../../public/contributors.json'))) {
    const box = new THREE.Box3().setFromObject(createHouse(c));
    for (const v of [box.min.x, box.max.x, box.min.z, box.max.z]) {
      assert.ok(Math.abs(v) <= PLOT_SIZE / 2, `${c.houseStyle} house stays inside 12 × 12 m`);
    }
  }
});
