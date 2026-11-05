import * as THREE from 'three';

export interface SkyState {
  /** Sun height above the horizon, -1 (midnight) to 1 (noon). */
  sunElevation: number;
  /** Unit vector from the scene towards the sun. */
  sunDirection: THREE.Vector3;
  /** 0 at night, 1 in full daylight. */
  daylight: number;
  /** 0 away from dawn/dusk, 1 with the sun on the horizon. */
  twilight: number;
  skyColor: THREE.Color;
}

const NIGHT_SKY = new THREE.Color(0x0b1226);
const DUSK_SKY = new THREE.Color(0xd77a55);
const DAY_SKY = new THREE.Color(0x8ec5ea);

/**
 * Pure sky model for a local hour in [0, 24). A simple circular sun path:
 * rises in the east at 06:00, peaks at 12:00, sets in the west at 18:00.
 */
export function skyAt(hour: number): SkyState {
  const h = ((hour % 24) + 24) % 24;
  const angle = ((h - 6) / 12) * Math.PI;
  const sunElevation = Math.sin(angle);
  // East is +X, the sun arcs over the south (-Z) side at a 30° tilt.
  const sunDirection = new THREE.Vector3(Math.cos(angle), Math.sin(angle), -0.5).normalize();
  const daylight = THREE.MathUtils.smoothstep(sunElevation, -0.08, 0.3);
  const twilight = 1 - THREE.MathUtils.clamp(Math.abs(sunElevation) / 0.25, 0, 1);
  const skyColor = NIGHT_SKY.clone().lerp(DAY_SKY, daylight).lerp(DUSK_SKY, twilight * 0.6);
  return { sunElevation, sunDirection, daylight, twilight, skyColor };
}

/** Local hour of the viewer, or the `?hour=` URL override (0–24, decimals allowed). */
export function viewerHour(now = new Date(), search = window.location.search): number {
  const override = new URLSearchParams(search).get('hour');
  if (override !== null && override.trim() !== '') {
    const h = Number(override);
    if (Number.isFinite(h)) return ((h % 24) + 24) % 24;
  }
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

/**
 * Scene lighting driven by the viewer's clock: sun, moon, hemisphere fill,
 * sky colour, fog and a star dome that fades out by day.
 */
export class DayNightSky {
  private sun = new THREE.DirectionalLight(0xfff1d6, 0);
  private moon = new THREE.DirectionalLight(0x9fb4ff, 0);
  private hemi = new THREE.HemisphereLight(0x3a4a7a, 0x0a0d12, 0.6);
  private stars: THREE.Points;
  private fog: THREE.Fog;
  private sinceUpdate = Infinity;
  /** Current state, refreshed about once a second. */
  state: SkyState;

  constructor(private scene: THREE.Scene, private hourSource: () => number = () => viewerHour()) {
    this.state = skyAt(hourSource());
    this.fog = new THREE.Fog(NIGHT_SKY.clone(), 25, 120);
    scene.fog = this.fog;
    scene.background = new THREE.Color();
    for (const light of [this.sun, this.moon]) {
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      const s = light.shadow.camera;
      s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.far = 160;
      scene.add(light, light.target);
    }
    scene.add(this.hemi);
    this.stars = createStars();
    scene.add(this.stars);
    this.update(0);
  }

  update(dt: number): void {
    this.sinceUpdate += dt;
    if (this.sinceUpdate < 1) return;
    this.sinceUpdate = 0;
    const st = (this.state = skyAt(this.hourSource()));

    (this.scene.background as THREE.Color).copy(st.skyColor);
    this.fog.color.copy(st.skyColor);
    this.fog.far = THREE.MathUtils.lerp(120, 220, st.daylight);

    this.sun.position.copy(st.sunDirection).multiplyScalar(60);
    this.sun.intensity = 2.2 * THREE.MathUtils.smoothstep(st.sunElevation, -0.02, 0.2);
    this.sun.color.setHSL(0.1, 0.8, THREE.MathUtils.lerp(0.65, 0.92, st.daylight));
    this.sun.castShadow = this.sun.intensity > 0.05;

    // The moon sits opposite the sun and lights the village while the sun is down.
    this.moon.position.copy(st.sunDirection).multiplyScalar(-60);
    this.moon.position.y = Math.abs(this.moon.position.y) + 15;
    this.moon.intensity = 0.5 * (1 - st.daylight);
    this.moon.castShadow = this.moon.intensity > 0.05;

    this.hemi.color.setHex(0x3a4a7a).lerp(new THREE.Color(0xbfdcff), st.daylight);
    this.hemi.groundColor.setHex(0x0a0d12).lerp(new THREE.Color(0x4a5a30), st.daylight);
    this.hemi.intensity = THREE.MathUtils.lerp(0.6, 1.1, st.daylight) + 0.4 * st.twilight;

    const starMat = this.stars.material as THREE.PointsMaterial;
    starMat.opacity = 1 - THREE.MathUtils.smoothstep(st.daylight, 0, 0.5);
    this.stars.visible = starMat.opacity > 0.01;
  }
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
  const mat = new THREE.PointsMaterial({
    color: 0xdfe6ff, size: 1.4, sizeAttenuation: false, fog: false, transparent: true,
  });
  const stars = new THREE.Points(geo, mat);
  stars.name = 'stars';
  return stars;
}
