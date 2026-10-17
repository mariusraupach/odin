import { beforeEach, describe, expect, it } from "vitest";
import { computeFlow } from "@/lib/anno/calc";
import { BUILDING, building, edge, GOOD, residence } from "@/test/plan";
import { describeSuppliers, usePlanStore } from "./store";

const store = () => usePlanStore.getState();
const node = (id: string) => store().nodes.find((n) => n.id === id)!;
const fishInput = (id: string) =>
  computeFlow(store().nodes, store().edges)
    .nodes.get(id)!
    .inputs.find((i) => i.good === GOOD.fish)!;

describe("addSuppliers", () => {
  beforeEach(() => {
    usePlanStore.setState({
      nodes: [
        building("fish", BUILDING.fishery, 2),
        residence("A", 80),
        residence("B", 40),
      ],
      edges: [edge("e1", "fish", "A", GOOD.fish)],
    });
  });

  it("connects spare output before adding new producers", () => {
    const result = store().addSuppliers("B");
    expect(result.connected).toBe(1);
    // Nothing made schnapps or work clothes yet.
    expect(result.added).toBe(2);
    expect(node("fish").data).toMatchObject({ count: 2 });
    expect(fishInput("B").actual).toBeCloseTo(fishInput("B").nominal);
  });

  it("grows existing producers instead of adding duplicates", () => {
    store().addSuppliers("B");
    store().updateNodeData("B", { houses: 200 });
    const result = store().addSuppliers("B");
    expect(result).toMatchObject({ expanded: 3, added: 0 });
    expect(
      store().nodes.filter(
        (n) => n.type === "building" && n.data.buildingId === BUILDING.fishery,
      ),
    ).toHaveLength(1);
    expect(fishInput("A").actual).toBeCloseTo(2);
    expect(fishInput("B").actual).toBeCloseTo(fishInput("B").nominal);
  });

  it("reports suppliers that are short on their own inputs", () => {
    store().addSuppliers("B");
    const result = store().addSuppliers("B");
    expect(result.connected + result.expanded + result.added).toBe(0);
    // The new distillery and knitters have no potatoes or wool.
    expect(result.starved).toBe(2);
    expect(describeSuppliers(result)).toBe(
      "No new suppliers needed. 2 suppliers are short on their own inputs: add suppliers to them too.",
    );
  });
});

describe("islands in the store", () => {
  beforeEach(() => {
    usePlanStore.setState({
      nodes: [building("fish", BUILDING.fishery), residence("res", 80)],
      edges: [edge("e1", "fish", "res", GOOD.fish)],
    });
    store().groupIntoIsland(["fish"]);
  });

  it("puts a node added inside an island on that island", () => {
    const island = store().nodes.find((n) => n.type === "island")!;
    const id = store().addNode(
      { type: "residence", data: { tierId: "15000000", houses: 10 } },
      { x: island.position.x + 50, y: island.position.y + 100 },
    );
    expect(node(id).parentId).toBe(island.id);
  });

  it("deletes what is on an island together with it", () => {
    const island = store().nodes.find((n) => n.type === "island")!;
    store().removeNodes([island.id]);
    expect(store().nodes.map((n) => n.id)).toEqual(["res"]);
    expect(store().edges).toEqual([]);
  });
});
