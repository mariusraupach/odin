import { buildings, goods, populationTiers, workforce } from "./data";
import type { Building, Good, PopulationTier, Workforce } from "./types";

export * from "./types";
export { buildings, goods, populationTiers, workforce };

const byId = <T extends { id: string }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item]));

export const goodsById: Map<string, Good> = byId(goods);
export const buildingsById: Map<string, Building> = byId(buildings);
export const tiersById: Map<string, PopulationTier> = byId(populationTiers);
export const workforceById: Map<string, Workforce> = byId(workforce);

export const goodName = (id: string) => goodsById.get(id)?.name ?? id;

/** Buildings that produce a good, Old World first. */
export function producersOf(goodId: string): Building[] {
  return buildings
    .filter((b) => b.outputs.some((o) => o.good === goodId))
    .sort(
      (a, b) =>
        Number(a.region !== "old-world") - Number(b.region !== "old-world"),
    );
}
