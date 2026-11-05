import * as THREE from 'three';
import type { Contributor } from './contributors';
import { buildVillage } from './houses';
import './village.css';

/** DOM labels provide readable, keyboard-accessible equivalents of mesh selection. */
export function mountVillage(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  contributors: readonly Contributor[],
  uiRoot: HTMLElement = document.body,
): { update: () => void; dispose: () => void } {
  const village = buildVillage(contributors);
  scene.add(village);
  const overlay = document.createElement('div');
  overlay.className = 'village-ui';
  const labels = document.createElement('div');
  labels.className = 'village-labels';
  const directory = document.createElement('details');
  directory.className = 'village-directory';
  const summary = document.createElement('summary');
  summary.textContent = `Neighbours · ${contributors.length}`;
  directory.append(summary);
  const list = document.createElement('ul');
  directory.append(list);
  const panel = document.createElement('section');
  panel.className = 'village-owner';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'House owner');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'village-close';
  close.textContent = 'Close';
  const title = document.createElement('h2');
  const identity = document.createElement('p');
  identity.className = 'village-owner-identity';
  const description = document.createElement('p');
  panel.append(close, title, identity, description);
  overlay.append(labels, directory, panel);
  uiRoot.append(overlay);

  let returnFocus: HTMLElement | null = null;
  const select = (contributor: Contributor, source?: HTMLElement) => {
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    returnFocus = source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    title.textContent = contributor.name;
    identity.textContent = `${contributor.kind === 'agent' ? 'AI agent' : 'Person'} · ${contributor.houseStyle} · Ring ${contributor.plot.ring}, plot ${contributor.plot.slot}`;
    description.textContent = contributor.description ?? 'A neighbour building Commit Village.';
    panel.hidden = false;
    close.focus({ preventScroll: true });
  };
  const dismiss = () => {
    panel.hidden = true;
    returnFocus?.focus({ preventScroll: true });
  };
  close.addEventListener('click', dismiss);
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !panel.hidden) dismiss();
  };
  document.addEventListener('keydown', onKey);

  const tags = village.children.map((house, index) => {
    const contributor = contributors[index]!;
    const makeButton = (className: string) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = contributor.name;
      button.setAttribute('aria-label', `Meet ${contributor.name}, ${contributor.kind === 'agent' ? 'AI agent' : 'person'}`);
      button.addEventListener('click', () => select(contributor, button));
      return button;
    };
    const tag = makeButton('village-name');
    labels.append(tag);
    const item = document.createElement('li');
    item.append(makeButton('village-directory-name'));
    list.append(item);
    return { tag, point: house.position.clone().add(new THREE.Vector3(0, house.userData.labelHeight as number, 0)) };
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let start: { x: number; y: number } | null = null;
  const onDown = (event: PointerEvent) => {
    start = { x: event.clientX, y: event.clientY };
  };
  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 || !start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
    const rect = canvas.getBoundingClientRect();
    if (document.pointerLockElement === canvas) pointer.set(0, 0);
    else pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(village.children, true)[0];
    if (!hit) return;
    let object: THREE.Object3D | null = hit.object;
    while (object && !object.userData.contributor) object = object.parent;
    if (object) {
      event.preventDefault();
      event.stopImmediatePropagation();
      select(object.userData.contributor as Contributor);
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('click', onClick, true);
  const projected = new THREE.Vector3();

  return {
    update() {
      const rect = canvas.getBoundingClientRect();
      camera.updateMatrixWorld();
      for (const { tag, point } of tags) {
        projected.copy(point).project(camera);
        const visible = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.9
          && camera.position.distanceToSquared(point) < 55 * 55;
        tag.hidden = !visible;
        if (visible) tag.style.transform = `translate(-50%, -50%) translate(${rect.left + (projected.x + 1) * rect.width / 2}px, ${rect.top + (1 - projected.y) * rect.height / 2}px)`;
      }
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      scene.remove(village);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      village.traverse(object => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    },
  };
}
