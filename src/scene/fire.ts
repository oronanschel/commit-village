import * as THREE from 'three';

export interface Fire {
  group: THREE.Group;
  update: (dt: number, elapsed: number) => void;
}

/** Procedural low-poly campfire: stone ring, crossed logs, flickering flames and light. */
export function createFire(): Fire {
  const group = new THREE.Group();
  group.name = 'fire';

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b6b70, flatShading: true });
  const stoneGeo = new THREE.DodecahedronGeometry(0.28, 0);
  const stones = 11;
  for (let i = 0; i < stones; i++) {
    const a = (i / stones) * Math.PI * 2;
    const s = new THREE.Mesh(stoneGeo, stoneMat);
    s.position.set(Math.cos(a) * 1.1, 0.15, Math.sin(a) * 1.1);
    s.rotation.set(a, a * 2, 0);
    s.scale.y = 0.75;
    s.castShadow = true;
    group.add(s);
  }

  const logMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1a, flatShading: true });
  const logGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.6, 6);
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(logGeo, logMat);
    log.rotation.z = Math.PI / 2 - 0.35;
    log.rotation.y = (i / 4) * Math.PI * 2;
    log.position.y = 0.35;
    log.castShadow = true;
    group.add(log);
  }

  const flameMats = [0xffd27a, 0xff9a3c, 0xff5a1f].map(
    (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }),
  );
  const flames: THREE.Mesh[] = [];
  const flameGeo = new THREE.ConeGeometry(0.35, 1.2, 5);
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(flameGeo, flameMats[i % flameMats.length]);
    const a = (i / 7) * Math.PI * 2;
    const r = i === 0 ? 0 : 0.25;
    f.position.set(Math.cos(a) * r, 0.75, Math.sin(a) * r);
    f.userData.phase = i * 1.7;
    f.userData.base = i === 0 ? 1.3 : 0.8;
    flames.push(f);
    group.add(f);
  }

  const light = new THREE.PointLight(0xff8a3a, 30, 30, 1.6);
  light.position.y = 1.4;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.002;
  group.add(light);

  const update = (_dt: number, t: number) => {
    for (const f of flames) {
      const p = f.userData.phase as number;
      const b = f.userData.base as number;
      const k = b * (0.85 + 0.2 * Math.sin(t * 9 + p) + 0.1 * Math.sin(t * 23 + p * 2));
      f.scale.set(1 - 0.1 * Math.sin(t * 7 + p), k, 1 - 0.1 * Math.cos(t * 6 + p));
      f.rotation.y = t * 0.8 + p;
      f.position.y = 0.45 + (k * 1.2) / 2;
    }
    light.intensity = 26 + 6 * Math.sin(t * 11) + 4 * Math.sin(t * 27 + 1.3);
  };

  return { group, update };
}
