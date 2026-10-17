import { describe, expect, it } from "vitest";
import { building, BUILDING, GOOD, TIER } from "@/test/plan";
import { computeFlow, type PlanNode } from "./calc";
import { buildingsById, goods, populationTiers, producersOf } from "./index";
import { chainToPlan, planChain, type Goal } from "./planner";

let counter = 0;
const newId = () => `n${++counter}`;
const build = (goal: Goal, ownIsland = false, existing: PlanNode[] = []) =>
  chainToPlan(goal, planChain(goal), existing, { ownIsland, newId });

describe("planChain", () => {
  it("sizes the farmers' chain", () => {
    const chain = planChain({
      kind: "residents",
      tierId: TIER.farmers,
      houses: 100,
    });
    const count = (id: string) =>
      chain.buildings.find((b) => b.buildingId === id)?.count;
    // 1000 farmers eat 2.5 t/min of fish and wear 3.08 t/min of work clothes.
    expect(count(BUILDING.fishery)).toBe(2);
    expect(count(BUILDING.frameworkKnitters)).toBe(2);
    expect(count(BUILDING.sheepFarm)).toBe(2);
    expect(chain.unavailable).toEqual([]);
  });

  it("combines shared intermediates into one building entry", () => {
    const chain = planChain({
      kind: "residents",
      tierId: TIER.workers,
      houses: 100,
    });
    const ids = chain.buildings.map((b) => b.buildingId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("adds up the workforce the chain needs", () => {
    const chain = planChain({ kind: "good", good: GOOD.fish, rate: 4 });
    expect(chain.buildings).toEqual([
      { buildingId: BUILDING.fishery, rate: 4, count: 2 },
    ]);
    expect(chain.workforce).toEqual([
      {
        workforce: buildingsById.get(BUILDING.fishery)!.workforce!.type,
        required: 2 * buildingsById.get(BUILDING.fishery)!.workforce!.count,
        provided: 0,
      },
    ]);
  });
});

describe("chainToPlan", () => {
  it.each(populationTiers.map((t) => [t.name, t.id]))(
    "fully supplies 50 houses of %s",
    (_, tierId) => {
      const { nodes, edges } = build({ kind: "residents", tierId, houses: 50 });
      const flow = computeFlow(nodes, edges);
      const residence = nodes.find((n) => n.type === "residence")!;
      for (const input of flow.nodes.get(residence.id)!.inputs)
        expect(input.actual).toBeCloseTo(input.nominal);
      for (const n of nodes)
        expect(flow.nodes.get(n.id)!.efficiency).toBeCloseTo(1);
    },
  );

  it.each(
    goods
      .filter((g) => producersOf(g.id).length > 0)
      .map((g) => [g.name, g.id]),
  )("runs a chain for 3 t/min of %s at full efficiency", (_, good) => {
    const { nodes, edges } = build({ kind: "good", good, rate: 3 });
    const flow = computeFlow(nodes, edges);
    for (const n of nodes)
      expect(flow.nodes.get(n.id)!.efficiency).toBeCloseTo(1);
    const made = nodes
      .flatMap((n) => flow.nodes.get(n.id)!.outputs)
      .filter((o) => o.good === good)
      .reduce((sum, o) => sum + o.actual, 0);
    expect(made).toBeGreaterThanOrEqual(3 - 1e-6);
  });

  it("puts the chain on its own island, New World goods on a second", () => {
    const { nodes } = build(
      { kind: "residents", tierId: populationTiers[2].id, houses: 20 },
      true,
    );
    const islands = nodes.filter((n) => n.type === "island");
    expect(islands.map((n) => n.data.name)).toEqual([
      "Artisans",
      "Artisans · New World",
    ]);
    expect(nodes.filter((n) => n.type !== "island" && !n.parentId)).toEqual([]);
  });

  it("places the chain to the right of the existing plan", () => {
    const existing = [building("old", BUILDING.fishery, 1, { x: 0, y: 40 })];
    const { nodes } = build(
      { kind: "good", good: GOOD.workClothes, rate: 2 },
      false,
      existing,
    );
    for (const n of nodes) expect(n.position.x).toBeGreaterThan(256);
    expect(Math.min(...nodes.map((n) => n.position.y))).toBe(40);
  });
});
