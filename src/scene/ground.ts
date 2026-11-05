import * as THREE from 'three';

/** Deterministic pseudo-random so the village looks the same for everyone. */
function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Low-poly ground: a flat clearing around the fire that rises into gentle
 * hills toward the edge, with flat-shaded faces and a few scattered rocks.
 */
export function createGround(radius = 90): THREE.Group {
  const group = new THREE.Group();

  const plane = new THREE.PlaneGeometry(radius * 2, radius * 2, 60, 60);
  plane.rotateX(-Math.PI / 2);
  const pos = plane.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const d = Math.hypot(x, z);
    const hill = THREE.MathUtils.smoothstep(d, 30, radius) * 9;
    const jitter = (hash(x, z) - 0.5) * (d < 6 ? 0 : 0.35);
    pos.setY(i, hill + jitter);
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
    rock.position.set(Math.cos(a) * d, THREE.MathUtils.smoothstep(d, 30, radius) * 9, Math.sin(a) * d);
    rock.rotation.set(hash(i, 4) * 3, hash(i, 5) * 3, 0);
    rock.castShadow = true;
    group.add(rock);
  }

  return group;
}
