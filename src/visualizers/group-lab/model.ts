/**
 * Radio groups: radios that share a `name` (in the same form) form one group. Only one of them
 * can be checked, the group is a single Tab stop, and arrow keys move between its radios.
 * Radios without a name each stand alone.
 */

export interface Radio {
  name: string | null;
  label: string;
}

/** Radios grouped by name; every unnamed radio is a group of its own. */
export function radioGroups(radios: readonly Radio[]): Radio[][] {
  const named = new Map<string, Radio[]>();
  const groups: Radio[][] = [];
  for (const radio of radios) {
    if (!radio.name) {
      groups.push([radio]);
      continue;
    }
    const group = named.get(radio.name);
    if (group) group.push(radio);
    else {
      const created = [radio];
      named.set(radio.name, created);
      groups.push(created);
    }
  }
  return groups;
}

/** How many times Tab stops on these radios. */
export function tabStops(radios: readonly Radio[]): number {
  return radioGroups(radios).length;
}

/** "2 of 3" within the radio's group, as screen readers announce it. */
export function position(radios: readonly Radio[], index: number): { pos: number; size: number } {
  const radio = radios[index];
  const group = radioGroups(radios).find((g) => radio && g.includes(radio)) ?? [];
  return { pos: radio ? group.indexOf(radio) + 1 : 0, size: group.length };
}
