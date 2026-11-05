import * as THREE from 'three';

/** Deterministic pseudo-random in [0, 1) so everyone sees the same village. */
function rand(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export interface Ambient {
  group: THREE.Group;
  /** `daylight` is 0 at night and 1 at noon (see DayNightSky.state). */
  update: (dt: number, elapsed: number, daylight: number) => void;
}

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- fireflies

const FIREFLY_COUNT = 140;

/** Where firefly `i` is at time `t`: a slow wander around its home spot near the ground. */
export function fireflyPosition(i: number, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const a = rand(i, 1) * Math.PI * 2;
  const r = 4 + rand(i, 2) * 26;
  const sp = 0.25 + rand(i, 3) * 0.35;
  const p = rand(i, 4) * 100;
  return out.set(
    Math.cos(a) * r + Math.sin(t * sp + p) * 1.6,
    0.5 + rand(i, 5) * 1.8 + Math.sin(t * sp * 1.7 + p * 2) * 0.35,
    Math.sin(a) * r + Math.cos(t * sp * 0.8 + p) * 1.6,
  );
}

/** Firefly glow in [0, 1]: mostly dim, with short soft blinks. */
export function fireflyGlow(i: number, t: number): number {
  const phase = (t * (0.35 + rand(i, 6) * 0.3) + rand(i, 7)) % 1;
  return 0.15 + 0.85 * Math.max(0, Math.sin(phase * Math.PI * 4)) ** 3;
}

/** Small radial falloff so points render as soft round glows, not squares. */
function glowTexture(size = 32): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const a = Math.max(0, 1 - d) ** 2;
      data.set([255, 255, 255, Math.round(a * 255)], (y * size + x) * 4);
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.needsUpdate = true;
  return tex;
}

function createFireflies(): Ambient {
  const positions = new Float32Array(FIREFLY_COUNT * 3);
  const colors = new Float32Array(FIREFLY_COUNT * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.5,
    map: glowTexture(),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.name = 'fireflies';
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(points);

  const base = new THREE.Color(0xd8ff7a);
  const v = new THREE.Vector3();
  const still = reducedMotion();
  const update = (_dt: number, t: number, daylight: number) => {
    const night = 1 - THREE.MathUtils.smoothstep(daylight, 0.05, 0.4);
    points.visible = night > 0.01;
    if (!points.visible) return;
    const time = still ? 0 : t;
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      fireflyPosition(i, time, v).toArray(positions, i * 3);
      const g = (still ? 0.6 : fireflyGlow(i, t)) * night;
      colors[i * 3] = base.r * g;
      colors[i * 3 + 1] = base.g * g;
      colors[i * 3 + 2] = base.b * g;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  };
  return { group, update };
}

// -------------------------------------------------------------------- birds

const BIRD_COUNT = 7;

/** Where bird `i` is at time `t`: wide lazy circles high above the village. */
export function birdPosition(i: number, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const r = 28 + rand(i, 11) * 22;
  const speed = (5 + rand(i, 12) * 3) / r; // ~5–8 m/s along the circle
  const a = rand(i, 13) * Math.PI * 2 + t * speed * (i % 2 ? 1 : -1);
  return out.set(Math.cos(a) * r, 22 + rand(i, 14) * 10 + Math.sin(t * 0.4 + i) * 1.5, Math.sin(a) * r);
}

function createBirds(): Ambient {
  const group = new THREE.Group();
  group.name = 'birds';
  const mat = new THREE.MeshLambertMaterial({ color: 0x2a2622, side: THREE.DoubleSide, flatShading: true });
  // One wing is a flat triangle hinged on the body; mirrored for the other side.
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.35, 0, 0, -0.25, 1.1, 0, -0.05], 3));
  wingGeo.computeVertexNormals();
  const bodyGeo = new THREE.ConeGeometry(0.12, 0.8, 4).rotateX(Math.PI / 2);

  const birds = Array.from({ length: BIRD_COUNT }, () => {
    const bird = new THREE.Group();
    const left = new THREE.Mesh(wingGeo, mat);
    const right = new THREE.Mesh(wingGeo, mat);
    right.scale.x = -1;
    bird.add(new THREE.Mesh(bodyGeo, mat), left, right);
    group.add(bird);
    return { bird, left, right };
  });

  const ahead = new THREE.Vector3();
  const still = reducedMotion();
  const update = (_dt: number, t: number, daylight: number) => {
    group.visible = daylight > 0.3;
    if (!group.visible) return;
    const time = still ? 0 : t;
    birds.forEach(({ bird, left, right }, i) => {
      birdPosition(i, time, bird.position);
      birdPosition(i, time + 0.1, ahead);
      bird.lookAt(ahead);
      bird.rotateY(Math.PI); // cone tip and wing leading edge point along +Z
      // Flap in bursts, then glide.
      const flapping = still ? 0 : Math.max(0, Math.sin(t * 0.7 + i * 1.3));
      const flap = Math.sin(t * 11 + i) * 0.6 * flapping + 0.1;
      left.rotation.z = flap;
      right.rotation.z = -flap;
    });
  };
  return { group, update };
}

// -------------------------------------------------------------------- smoke

/**
 * Low-poly smoke that rises and fades from `origin` (e.g. a chimney top or the
 * campfire). Puffs are recycled, so cost stays constant.
 */
export function createSmoke(origin: THREE.Vector3, puffs = 10, height = 6): Ambient {
  const group = new THREE.Group();
  group.name = 'smoke';
  group.position.copy(origin);
  const geo = new THREE.IcosahedronGeometry(0.3, 0);
  const meshes = Array.from({ length: puffs }, (_, i) => {
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({ color: 0x9a9690, transparent: true, depthWrite: false, flatShading: true }),
    );
    m.userData.offset = i / puffs;
    group.add(m);
    return m;
  });
  const still = reducedMotion();
  const update = (_dt: number, t: number, daylight: number) => {
    for (const m of meshes) {
      const k = still ? m.userData.offset : (t * 0.12 + m.userData.offset) % 1;
      const o = m.userData.offset * 10;
      m.position.set(Math.sin(k * 5 + o) * 0.3 + k * 1.2, k * height, Math.cos(k * 4 + o) * 0.3);
      m.scale.setScalar(0.5 + k * 1.6);
      m.rotation.set(k * 3 + o, k * 2, 0);
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = Math.sin(k * Math.PI) * THREE.MathUtils.lerp(0.18, 0.32, daylight);
    }
  };
  return { group, update };
}

/** Fireflies at night and birds by day; add chimney smoke per house with createSmoke. */
export function createAmbientLife(): Ambient {
  const parts = [createFireflies(), createBirds()];
  const group = new THREE.Group();
  group.name = 'ambient-life';
  for (const p of parts) group.add(p.group);
  return {
    group,
    update: (dt, t, daylight) => {
      for (const p of parts) p.update(dt, t, daylight);
    },
  };
}
