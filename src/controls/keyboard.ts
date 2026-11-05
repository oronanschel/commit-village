import * as THREE from 'three';
import { terrainHeight } from '../scene/ground';

const EYE_HEIGHT = 1.7;
const SPEED = 6; // metres per second
const RUN_MULT = 1.8;
const LOOK_SPEED = 0.004; // radians per pixel dragged
const TURN_SPEED = 1.8; // radians per second for Q/E

/**
 * First-person walker: WASD/arrows move, Shift runs, Q/E turn, mouse drag looks.
 * Keeps the camera at eye height above the terrain.
 */
export class KeyboardWalker {
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = -0.1;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private dragDistance = 0;
  /** Inputs added by other controllers (e.g. touch joystick), each in [-1, 1]. */
  readonly external = { forward: 0, strafe: 0 };

  constructor(private camera: THREE.PerspectiveCamera, dom: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    dom.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.dragging = true;
      this.dragDistance = 0;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.dragDistance += Math.abs(dx) + Math.abs(dy);
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.look(dx, dy);
    });
    window.addEventListener('pointerup', () => (this.dragging = false));
  }

  /** True if the last mouse press moved enough to count as a drag rather than a click. */
  get wasDrag(): boolean {
    return this.dragDistance > 5;
  }

  look(dx: number, dy: number): void {
    this.yaw -= dx * LOOK_SPEED;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * LOOK_SPEED, -1.2, 1.2);
  }

  placeAt(position: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.camera.position.set(position.x, terrainHeight(position.x, position.z) + EYE_HEIGHT, position.z);
    const d = lookAt.clone().sub(this.camera.position);
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    this.apply();
  }

  update(dt: number): void {
    const k = this.keys;
    if (k.has('KeyQ')) this.yaw += TURN_SPEED * dt;
    if (k.has('KeyE')) this.yaw -= TURN_SPEED * dt;

    let forward = this.external.forward;
    let strafe = this.external.strafe;
    if (k.has('KeyW') || k.has('ArrowUp')) forward += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) forward -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) strafe += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) strafe -= 1;

    const len = Math.hypot(forward, strafe);
    if (len > 1) {
      forward /= len;
      strafe /= len;
    }
    const speed = SPEED * (k.has('ShiftLeft') || k.has('ShiftRight') ? RUN_MULT : 1) * dt;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const p = this.camera.position;
    p.x += (-sin * forward + cos * strafe) * speed;
    p.z += (-cos * forward - sin * strafe) * speed;

    // Stay out of the fire and inside the valley.
    const d = Math.hypot(p.x, p.z);
    const clamped = THREE.MathUtils.clamp(d, 1.8, 60);
    if (clamped !== d) {
      const k2 = clamped / Math.max(d, 1e-3);
      p.x *= k2;
      p.z *= k2;
    }
    p.y = terrainHeight(p.x, p.z) + EYE_HEIGHT;
    this.apply();
  }

  private apply(): void {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
