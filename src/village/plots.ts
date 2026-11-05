/** Plot addresses stay stable when contributors are added or reordered. */
export interface Plot { ring: number; slot: number }
export interface PlotTransform { x: number; z: number; rotation: number }
/** Charter §1: every plot is a 12 × 12 m square facing the fire. */
export const PLOT_SIZE = 12;
export const FIRST_RING_RADIUS = 21;
/** One plot deep plus a 2 m common path between rings. */
export const RING_SPACING = PLOT_SIZE + 2;
export const MAX_RING = 5;

export function ringRadius(ring: number): number {
  return FIRST_RING_RADIUS + (ring - 1) * RING_SPACING;
}

/** As many slots as fit without neighbouring squares touching at their inner corners. */
export function slotsInRing(ring: number): number {
  if (!Number.isInteger(ring) || ring < 1 || ring > MAX_RING) {
    throw new Error(`Plot ring must be an integer from 1 to ${MAX_RING}.`);
  }
  const half = PLOT_SIZE / 2;
  return Math.floor(Math.PI / Math.atan(half / (ringRadius(ring) - half)));
}

export function plotTransform(plot: Plot): PlotTransform {
  const capacity = slotsInRing(plot.ring);
  if (!Number.isInteger(plot.slot) || plot.slot < 0 || plot.slot >= capacity) {
    throw new Error(`Ring ${plot.ring} slot must be an integer from 0 to ${capacity - 1}.`);
  }
  const angle = (plot.slot / capacity) * Math.PI * 2;
  const radius = ringRadius(plot.ring);
  const x = Math.sin(angle) * radius;
  const z = -Math.cos(angle) * radius;
  return { x, z, rotation: Math.atan2(-x, -z) };
}
