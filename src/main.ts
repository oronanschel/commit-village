import * as THREE from 'three';
import { createGround } from './scene/ground';
import { createFire } from './scene/fire';
import { DayNightSky } from './scene/sky';
import { createAmbientLife, createSmoke } from './scene/ambient';
import { KeyboardWalker } from './controls/keyboard';
import { TouchControls } from './controls/touch';
import { loadContributors } from './village/contributors';
import { mountVillage } from './village/interactions';

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

const sky = new DayNightSky(scene);
onTick((dt) => sky.update(dt));
scene.add(createGround());

const fire = createFire();
scene.add(fire.group);
onTick(fire.update);

const ambient = createAmbientLife();
const fireSmoke = createSmoke(new THREE.Vector3(0, 1.6, 0), 12, 7);
scene.add(ambient.group, fireSmoke.group);
onTick((dt, t) => {
  ambient.update(dt, t, sky.state.daylight);
  fireSmoke.update(dt, t, sky.state.daylight);
});

const walker = new KeyboardWalker(camera, renderer.domElement);
walker.placeAt(new THREE.Vector3(0, 0, 14), new THREE.Vector3(0, 1, 0));
onTick((dt) => walker.update(dt));
new TouchControls(walker, renderer.domElement);

if (window.matchMedia('(pointer: coarse)').matches) {
  const hud = document.getElementById('hud');
  if (hud) hud.textContent = 'Left thumb to walk · drag to look';
}

loadContributors().then(contributors => {
  const village = mountVillage(scene, camera, renderer.domElement, contributors, document.body, () => walker.wasDrag);
  onTick(village.update);
  scene.traverse(o => { if (typeof o.userData.update === 'function') onTick((_dt, t) => o.userData.update(t)); });
}).catch(error => {
  console.error('Village houses could not load:', error);
  const notice = document.createElement('p');
  notice.className = 'village-load-error';
  notice.setAttribute('role', 'alert');
  notice.textContent = 'Houses could not load. You can still explore; reload to try again.';
  document.body.append(notice);
});

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
