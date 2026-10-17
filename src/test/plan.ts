import type { PlanEdge, PlanNode } from "@/lib/anno/calc";

// Ids from the game data used across tests.
export const BUILDING = {
  fishery: "1010278",
  sheepFarm: "1010267",
  frameworkKnitters: "1010315",
  potatoFarm: "1010265",
  schnappsDistillery: "1010294",
  ironMine: "1010305",
  coalMine: "1010304",
  furnace: "1010297",
  cannery: "1010295",
  artisanalKitchen: "1010293",
};
export const GOOD = {
  fish: "1010200",
  wool: "1010197",
  workClothes: "1010237",
  potatoes: "1010195",
  schnapps: "1010216",
  iron: "1010227",
  coal: "1010226",
  goulash: "1010215",
};
export const TIER = { farmers: "15000000", workers: "15000001" };
export const FARMER_WORKFORCE = "1010052";

export const building = (
  id: string,
  buildingId: string,
  count = 1,
  position = { x: 0, y: 0 },
  productivity = 100,
): PlanNode => ({
  id,
  type: "building",
  position,
  data: { buildingId, count, productivity },
});

export const residence = (
  id: string,
  houses: number,
  tierId = TIER.farmers,
  position = { x: 0, y: 0 },
): PlanNode => ({ id, type: "residence", position, data: { tierId, houses } });

export const edge = (
  id: string,
  source: string,
  target: string,
  good: string,
): PlanEdge => ({
  id,
  type: "flow",
  source,
  target,
  sourceHandle: `out:${good}`,
  targetHandle: `in:${good}`,
});
