import * as THREE from 'three';

/** Static night lighting: dim blue moonlight, sky and fog. Day/night cycle will replace this. */
export function createNightLighting(scene: THREE.Scene): void {
  const sky = new THREE.Color(0x0b1226);
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 25, 120);

  scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x0a0d12, 0.6));

  const moon = new THREE.DirectionalLight(0x9fb4ff, 0.5);
  moon.position.set(-30, 50, -20);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  const s = moon.shadow.camera;
  s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.far = 150;
  scene.add(moon);

  scene.add(createStars());
}

/** A dome of point stars, fixed so constellations stay put between visits. */
function createStars(count = 900, radius = 300): THREE.Points {
  const positions = new Float32Array(count * 3);
  let seed = 42;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2;
    const y = 0.08 + rand() * 0.92; // upper hemisphere only
    const r = Math.sqrt(1 - y * y);
    positions.set([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.4, sizeAttenuation: false, fog: false });
  const stars = new THREE.Points(geo, mat);
  stars.name = 'stars';
  return stars;
}
