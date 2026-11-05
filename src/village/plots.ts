/** Plot addresses stay stable when contributors are added or reordered. */
export interface Plot { ring: number; slot: number }
export interface PlotTransform { x: number; z: number; rotation: number }
export const FIRST_RING_RADIUS = 14;
export const RING_SPACING = 10;
export const MAX_RING = 8;

export function slotsInRing(ring: number): number {
  if (!Number.isInteger(ring) || ring < 1 || ring > MAX_RING) {
    throw new Error(`Plot ring must be an integer from 1 to ${MAX_RING}.`);
  }
  return ring * 8;
}

export function plotTransform(plot: Plot): PlotTransform {
  const capacity = slotsInRing(plot.ring);
  if (!Number.isInteger(plot.slot) || plot.slot < 0 || plot.slot >= capacity) {
    throw new Error(`Ring ${plot.ring} slot must be an integer from 0 to ${capacity - 1}.`);
  }
  const angle = (plot.slot / capacity) * Math.PI * 2;
  const radius = FIRST_RING_RADIUS + (plot.ring - 1) * RING_SPACING;
  const x = Math.sin(angle) * radius;
  const z = -Math.cos(angle) * radius;
  return { x, z, rotation: Math.atan2(-x, -z) };
}
