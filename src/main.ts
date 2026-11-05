import * as THREE from 'three';
import { createGround } from './scene/ground';
import { createFire } from './scene/fire';
import { createNightLighting } from './scene/lighting';
import { KeyboardWalker } from './controls/keyboard';

type TickFn = (dt: number, elapsed: number) => void;
const tickers: TickFn[] = [];

/** Register a per-frame callback. dt and elapsed are in seconds. */
export function onTick(fn: TickFn): void {
  tickers.push(fn);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 700);

createNightLighting(scene);
scene.add(createGround());

const fire = createFire();
scene.add(fire.group);
onTick(fire.update);

const walker = new KeyboardWalker(camera, renderer.domElement);
walker.placeAt(new THREE.Vector3(0, 0, 14), new THREE.Vector3(0, 1, 0));
onTick((dt) => walker.update(dt));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;
  for (const fn of tickers) fn(dt, elapsed);
  renderer.render(scene, camera);
});
