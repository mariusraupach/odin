import {
  buildings,
  goodCategories,
  goods,
  populationTiers,
  workforce,
} from "./data";
import type { Building, Good, PopulationTier, Workforce } from "./types";

export * from "./types";
export { unlockTier } from "./unlocks";
export { buildings, goodCategories, goods, populationTiers, workforce };

const byId = <T extends { id: string }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item]));

export const goodsById: Map<string, Good> = byId(goods);
export const buildingsById: Map<string, Building> = byId(buildings);
export const tiersById: Map<string, PopulationTier> = byId(populationTiers);
export const workforceById: Map<string, Workforce> = byId(workforce);

export const goodName = (id: string) => goodsById.get(id)?.name ?? id;

const oldWorldFirst = (a: Building, b: Building) =>
  Number(a.region !== "old-world") - Number(b.region !== "old-world");

/** Buildings that use a good as an input, Old World first. */
export function consumersOf(goodId: string): Building[] {
  return buildings
    .filter((b) => b.inputs.some((i) => i.good === goodId))
    .sort(oldWorldFirst);
}

/** Population tiers that need a good. */
export function tiersNeeding(goodId: string): PopulationTier[] {
  return populationTiers.filter((t) => t.needs.some((n) => n.good === goodId));
}

/** Buildings that produce a good, Old World first. */
export function producersOf(goodId: string): Building[] {
  return buildings
    .filter((b) => b.outputs.some((o) => o.good === goodId))
    .sort(oldWorldFirst);
}
