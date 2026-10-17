import { buildings, populationTiers } from "./data";
import type { Building, PopulationTier } from "./types";

/*
 * The game data has no unlock conditions, so the tier a building unlocks at
 * is derived: a good belongs to the first tier that needs it, directly or
 * further down a chain (Grain -> Flour -> Bread -> Workers). Goods no tier
 * consumes, like construction materials, are pinned to their in-game unlock.
 */
const PINNED: Record<string, number> = {
  "1010196": 0, // Timber
  "1010205": 1, // Bricks
  "1010210": 1, // Sails
  "1010218": 1, // Steel Beams
  "1010221": 1, // Weapons
  "1010207": 2, // Windows
  "1010202": 3, // Reinforced Concrete
  "1010223": 3, // Advanced Weapons
  "1010224": 3, // Steam Motors
  "1010566": 3, // Oil
};

function goodTiers(): Map<string, number> {
  const tierOf = new Map<string, number>(Object.entries(PINNED));
  const lower = (good: string, tier: number) => {
    if (tier >= (tierOf.get(good) ?? Infinity)) return false;
    tierOf.set(good, tier);
    return true;
  };
  populationTiers.forEach((tier, index) => {
    for (const need of tier.needs) lower(need.good, index);
  });
  // Push tiers up the chains until nothing changes.
  let changed = true;
  while (changed) {
    changed = false;
    for (const building of buildings) {
      const tier = tierOf.get(building.outputs[0].good);
      if (tier === undefined) continue;
      for (const input of building.inputs)
        changed = lower(input.good, tier) || changed;
    }
  }
  return tierOf;
}

const tierByGood = goodTiers();

/** The population tier a building becomes available with. */
export function unlockTier(building: Building): PopulationTier {
  const index =
    tierByGood.get(building.outputs[0].good) ?? populationTiers.length - 1;
  return populationTiers[index];
}
