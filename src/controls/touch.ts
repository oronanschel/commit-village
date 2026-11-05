import type { KeyboardWalker } from './keyboard';

const JOYSTICK_RADIUS = 56; // px the knob can travel from the joystick centre
const DEAD_ZONE = 0.15;
const TOUCH_LOOK_SCALE = 1.4; // touch drags turn a little faster than mouse drags

/**
 * Converts a thumb offset from the joystick centre (screen pixels, +y down)
 * into walk input in [-1, 1]. Small offsets inside the dead zone are ignored.
 */
export function joystickInput(dx: number, dy: number, radius = JOYSTICK_RADIUS): { forward: number; strafe: number } {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { forward: 0, strafe: 0 };
  const mag = Math.min(len / radius, 1);
  if (mag < DEAD_ZONE) return { forward: 0, strafe: 0 };
  const scaled = (mag - DEAD_ZONE) / (1 - DEAD_ZONE);
  return { forward: (-dy / len) * scaled, strafe: (dx / len) * scaled };
}

/** True if a touch starting here should drive the joystick (lower-left of the screen). */
export function isJoystickZone(x: number, y: number, width: number, height: number): boolean {
  return x < width * 0.4 && y > height * 0.45;
}

/**
 * Touch controls: a floating joystick appears under the left thumb to walk,
 * and dragging anywhere else turns the camera. Short taps are left alone so
 * click handlers (e.g. house selection) still fire; check `walker.wasDrag`.
 */
export class TouchControls {
  private joyId: number | null = null;
  private joyX = 0;
  private joyY = 0;
  private looks = new Map<number, { x: number; y: number }>();
  private base: HTMLDivElement;
  private knob: HTMLDivElement;

  constructor(private walker: KeyboardWalker, dom: HTMLElement) {
    this.base = document.createElement('div');
    this.base.className = 'joystick';
    this.knob = document.createElement('div');
    this.knob.className = 'joystick-knob';
    this.base.appendChild(this.knob);
    document.body.appendChild(this.base);

    dom.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('pointercancel', (e) => this.up(e));
  }

  private down(e: PointerEvent): void {
    if (e.pointerType === 'mouse') return;
    // Only the first finger of a gesture starts a new press, so a second finger
    // can't clear the drag state of a joystick that is still held.
    if (this.joyId === null && this.looks.size === 0) this.walker.beginPress();
    if (this.joyId === null && isJoystickZone(e.clientX, e.clientY, window.innerWidth, window.innerHeight)) {
      this.joyId = e.pointerId;
      this.joyX = e.clientX;
      this.joyY = e.clientY;
      // Using the joystick is never a tap on whatever is underneath it.
      this.walker.addDragDistance(Infinity);
      this.base.style.left = `${e.clientX}px`;
      this.base.style.top = `${e.clientY}px`;
      this.base.classList.add('active');
      this.setKnob(0, 0);
    } else {
      this.looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  }

  private move(e: PointerEvent): void {
    if (e.pointerId === this.joyId) {
      const dx = e.clientX - this.joyX;
      const dy = e.clientY - this.joyY;
      const input = joystickInput(dx, dy);
      this.walker.external.forward = input.forward;
      this.walker.external.strafe = input.strafe;
      const len = Math.hypot(dx, dy);
      const k = len > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / len : 1;
      this.setKnob(dx * k, dy * k);
      return;
    }
    const last = this.looks.get(e.pointerId);
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last.x = e.clientX;
    last.y = e.clientY;
    this.walker.addDragDistance(Math.abs(dx) + Math.abs(dy));
    this.walker.look(dx * TOUCH_LOOK_SCALE, dy * TOUCH_LOOK_SCALE);
  }

  private up(e: PointerEvent): void {
    if (e.pointerId === this.joyId) {
      this.joyId = null;
      this.walker.external.forward = 0;
      this.walker.external.strafe = 0;
      this.base.classList.remove('active');
    }
    this.looks.delete(e.pointerId);
  }

  private setKnob(x: number, y: number): void {
    this.knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }
}
