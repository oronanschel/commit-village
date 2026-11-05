import * as THREE from 'three';

/** Deterministic pseudo-random so the village looks the same for everyone. */
function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const FLAT_RADIUS = 30;
const HILL_HEIGHT = 9;
export const GROUND_RADIUS = 90;

/** Smooth terrain height (without the small per-vertex jitter) at a world position. */
export function terrainHeight(x: number, z: number): number {
  return THREE.MathUtils.smoothstep(Math.hypot(x, z), FLAT_RADIUS, GROUND_RADIUS) * HILL_HEIGHT;
}

/**
 * Low-poly ground: a flat clearing around the fire that rises into gentle
 * hills toward the edge, with flat-shaded faces and a few scattered rocks.
 */
export function createGround(radius = GROUND_RADIUS): THREE.Group {
  const group = new THREE.Group();

  const plane = new THREE.PlaneGeometry(radius * 2, radius * 2, 60, 60);
  plane.rotateX(-Math.PI / 2);
  const pos = plane.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const d = Math.hypot(x, z);
    const jitter = (hash(x, z) - 0.5) * (d < 6 ? 0 : 0.35);
    pos.setY(i, terrainHeight(x, z) + jitter);
  }
  const ground = new THREE.Mesh(
    plane.toNonIndexed(),
    new THREE.MeshStandardMaterial({ color: 0x2f4a2a, flatShading: true, roughness: 1 }),
  );
  ground.geometry.computeVertexNormals();
  ground.receiveShadow = true;
  ground.name = 'ground';
  group.add(ground);

  // Packed-earth clearing around the fire.
  const clearing = new THREE.Mesh(
    new THREE.CircleGeometry(5, 9),
    new THREE.MeshStandardMaterial({ color: 0x4a3b2a, flatShading: true, roughness: 1 }),
  );
  clearing.rotation.x = -Math.PI / 2;
  clearing.position.y = 0.02;
  clearing.receiveShadow = true;
  group.add(clearing);

  // Scattered rocks beyond the house rings.
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5b5f66, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const a = hash(i, 1) * Math.PI * 2;
    const d = 32 + hash(i, 2) * 45;
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const sc = 0.4 + hash(i, 3) * 1.2;
    rock.scale.set(sc, sc * 0.7, sc);
    const rx = Math.cos(a) * d;
    const rz = Math.sin(a) * d;
    rock.position.set(rx, terrainHeight(rx, rz), rz);
    rock.rotation.set(hash(i, 4) * 3, hash(i, 5) * 3, 0);
    rock.castShadow = true;
    group.add(rock);
  }

  return group;
}
