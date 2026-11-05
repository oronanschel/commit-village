import * as THREE from 'three';

const CHICKENS = 8;
const RING_RADIUS = 3;

/** Original low-poly chickens standing in a circle, facing its centre. Origin is ground level. */
export function createChickenRing(): THREE.Group {
  const ring = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0xf1ead8, roughness: 1, flatShading: true });
  const comb = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 1, flatShading: true });
  const beak = new THREE.MeshStandardMaterial({ color: 0xe8a23a, roughness: 1, flatShading: true });
  const heads: THREE.Object3D[] = [];
  for (let i = 0; i < CHICKENS; i++) {
    const angle = (i / CHICKENS) * Math.PI * 2;
    const chicken = new THREE.Group();
    chicken.position.set(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS);
    chicken.rotation.y = angle + Math.PI; // face the centre
    const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), body);
    torso.scale.set(0.85, 0.8, 1.1);
    torso.position.y = 0.42;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 4), body);
    tail.position.set(0, 0.6, -0.32);
    tail.rotation.x = -0.7;
    for (const x of [-0.1, 0.1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 4), beak);
      leg.position.set(x, 0.1, 0);
      chicken.add(leg);
    }
    // The head pivots at the neck so it can peck forward.
    const head = new THREE.Group();
    head.position.set(0, 0.62, 0.22);
    const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), body);
    skull.position.y = 0.1;
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.14), comb);
    crest.position.y = 0.26;
    const bill = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), beak);
    bill.position.set(0, 0.08, 0.16);
    bill.rotation.x = Math.PI / 2;
    head.add(skull, crest, bill);
    head.userData.phase = i * 1.7;
    heads.push(head);
    chicken.add(torso, tail, head);
    chicken.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    ring.add(chicken);
  }
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Idle pecking: each chicken dips its head now and then, out of step with its neighbours. */
  ring.userData.update = (t: number) => {
    if (still) return;
    for (const head of heads) {
      const cycle = (t + head.userData.phase) % 3;
      head.rotation.x = cycle < 0.5 ? Math.sin((cycle / 0.5) * Math.PI) * 1.1 : Math.sin(t * 2 + head.userData.phase) * 0.08;
    }
  };
  ring.userData.labelHeight = 2.4;
  return ring;
}
