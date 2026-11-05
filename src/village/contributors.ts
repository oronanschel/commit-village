import { plotTransform, type Plot } from './plots';

export const HOUSE_STYLES = ['cottage', 'timber', 'tower', 'windmill'] as const;
export type HouseStyle = typeof HOUSE_STYLES[number];
export interface Contributor {
  id: string;
  name: string;
  kind: 'person' | 'agent';
  houseStyle: HouseStyle;
  plot: Plot;
  description?: string;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate at the boundary so a malformed contribution fails with an actionable error. */
export function parseContributors(input: unknown): Contributor[] {
  if (!Array.isArray(input)) throw new Error('contributors.json must contain an array.');
  const ids = new Set<string>();
  const plots = new Set<string>();
  return input.map((value: unknown, index) => {
    const fail = (reason: string): never => { throw new Error(`Contributor ${index + 1}: ${reason}`); };
    if (!record(value)) return fail('expected an object.');
    if (typeof value.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) {
      return fail('id must use lowercase letters, digits and single hyphens.');
    }
    if (ids.has(value.id)) return fail(`duplicate id "${value.id}".`);
    if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 48) {
      return fail('name must contain 1–48 characters.');
    }
    if (value.kind !== 'person' && value.kind !== 'agent') return fail('kind must be person or agent.');
    if (!HOUSE_STYLES.includes(value.houseStyle as HouseStyle)) return fail(`houseStyle must be ${HOUSE_STYLES.join(', ')}.`);
    if (!record(value.plot) || typeof value.plot.ring !== 'number' || typeof value.plot.slot !== 'number') {
      return fail('plot needs numeric ring and slot.');
    }
    const plot = { ring: value.plot.ring, slot: value.plot.slot };
    try { plotTransform(plot); } catch (error) { return fail((error as Error).message); }
    const address = `${plot.ring}:${plot.slot}`;
    if (plots.has(address)) return fail(`plot ${address} is already occupied.`);
    if (value.description !== undefined && (typeof value.description !== 'string' || value.description.length > 240)) {
      return fail('description must be text up to 240 characters.');
    }
    ids.add(value.id);
    plots.add(address);
    return {
      id: value.id, name: value.name.trim(), kind: value.kind,
      houseStyle: value.houseStyle as HouseStyle, plot,
      ...(value.description === undefined ? {} : { description: value.description as string }),
    };
  });
}

export async function loadContributors(baseUrl = import.meta.env.BASE_URL): Promise<Contributor[]> {
  const response = await fetch(`${baseUrl}contributors.json`);
  if (!response.ok) throw new Error(`Could not load contributors.json (${response.status}).`);
  return parseContributors(await response.json());
}
