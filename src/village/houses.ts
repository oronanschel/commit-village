import * as THREE from 'three';
import type { Contributor } from './contributors';
import { plotTransform } from './plots';
import { createChickenRing } from './chickens';

const PALETTES = {
  cottage: { wall: 0xc2a47c, roof: 0x8e4e42, trim: 0x533d36 },
  timber: { wall: 0xa8bda2, roof: 0x394d59, trim: 0x463b32 },
  tower: { wall: 0xa4a4bd, roof: 0x555179, trim: 0x444052 },
};

/** Original geometric house: local +Z is the entrance; the origin is ground level. */
export function createHouse(contributor: Contributor): THREE.Group {
  if (contributor.houseStyle === 'chicken-ring') {
    const ring = createChickenRing();
    ring.name = `house:${contributor.id}`;
    ring.userData.contributor = contributor;
    return ring;
  }
  const house = new THREE.Group();
  house.name = `house:${contributor.id}`;
  house.userData.contributor = contributor;
  const palette = PALETTES[contributor.houseStyle as keyof typeof PALETTES];
  const wall = new THREE.MeshStandardMaterial({ color: palette.wall, roughness: 1, flatShading: true });
  const roof = new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 1, flatShading: true });
  const trim = new THREE.MeshStandardMaterial({ color: palette.trim, roughness: 1 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x777876, roughness: 1 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xffb956, emissiveIntensity: 0.85, roughness: 0.6 });
  const height = contributor.houseStyle === 'tower' ? 4.4 : 3;

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    house.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) =>
    add(new THREE.BoxGeometry(w, h, d), material, x, y, z);

  box(4.8, 0.25, 4.6, stone, 0, 0.125, 0);
  box(4, height, 3.6, wall, 0, height / 2 + 0.25, 0);
  box(1, 1.85, 0.12, trim, 0, 1.175, 1.85);
  add(new THREE.SphereGeometry(0.065, 6, 4), glass, 0.31, 1.15, 1.94);
  box(1.4, 0.2, 0.75, stone, 0, 0.18, 2.05);

  // Extruded gable triangle, authored here rather than loaded from an external asset.
  const gable = new THREE.Shape();
  gable.moveTo(-2.45, 0);
  gable.lineTo(2.45, 0);
  gable.lineTo(0, 1.9);
  gable.closePath();
  const roofGeometry = new THREE.ExtrudeGeometry(gable, { depth: 4.3, bevelEnabled: false });
  roofGeometry.translate(0, 0, -2.15);
  add(roofGeometry, roof, 0, height + 0.25, 0);
  box(0.55, 1.5, 0.6, stone, 1.1, height + 1.5, -0.8);

  for (const x of [-1.25, 1.25]) {
    box(0.8, 0.9, 0.12, trim, x, 1.85, 1.86);
    box(0.6, 0.7, 0.14, glass, x, 1.85, 1.88);
    box(0.06, 0.72, 0.16, trim, x, 1.85, 1.9);
    box(0.62, 0.06, 0.16, trim, x, 1.85, 1.9);
  }
  for (const x of [-2.02, 2.02]) {
    box(0.12, 0.95, 1, trim, x, 1.85, 0);
    box(0.14, 0.72, 0.76, glass, x * 1.005, 1.85, 0);
  }
  if (contributor.houseStyle === 'timber') {
    for (const x of [-1.9, 1.9]) box(0.18, height, 0.12, trim, x, height / 2 + 0.25, 1.86);
    box(4.1, 0.18, 0.14, trim, 0, 2.8, 1.87);
  }
  if (contributor.houseStyle === 'tower') {
    box(0.9, 0.95, 0.12, trim, 0, 3.6, 1.86);
    box(0.65, 0.7, 0.14, glass, 0, 3.6, 1.88);
  }
  house.userData.labelHeight = height + 2.8;
  return house;
}

export function buildVillage(contributors: readonly Contributor[]): THREE.Group {
  const village = new THREE.Group();
  village.name = 'village-houses';
  for (const contributor of contributors) {
    const house = createHouse(contributor);
    const plot = plotTransform(contributor.plot);
    house.position.set(plot.x, 0, plot.z);
    house.rotation.y = plot.rotation;
    village.add(house);
  }
  return village;
}
