import { describe, expect, it } from "vitest";
import {
  BUILDING,
  building,
  edge,
  FARMER_WORKFORCE,
  GOOD,
  residence,
} from "@/test/plan";
import { computeFlow, type PlanNode } from "./calc";
import {
  absolutePosition,
  groupIntoIsland,
  nodeSize,
  reparent,
  ungroupIsland,
} from "./islands";
import { arrangeNodes } from "./layout";

// Island A makes fish and schnapps, island B houses the farmers eating them.
function twoIslands() {
  let nodes: PlanNode[] = [
    building("fish", BUILDING.fishery, 2, { x: 0, y: 0 }),
    building("pot", BUILDING.potatoFarm, 1, { x: 0, y: 250 }),
    building("dist", BUILDING.schnappsDistillery, 1, { x: 300, y: 250 }),
    residence("res", 80, undefined, { x: 900, y: 100 }),
  ];
  nodes = groupIntoIsland(nodes, ["fish", "pot", "dist"], "A");
  nodes = groupIntoIsland(nodes, ["res"], "B");
  const edges = [
    edge("e1", "fish", "res", GOOD.fish),
    edge("e2", "pot", "dist", GOOD.potatoes),
    edge("e3", "dist", "res", GOOD.schnapps),
  ];
  return { nodes, edges };
}

const byId = (nodes: PlanNode[], id: string) => nodes.find((n) => n.id === id)!;

describe("islands", () => {
  it("groups nodes without moving them and lists islands first", () => {
    const { nodes } = twoIslands();
    expect(nodes[0].type).toBe("island");
    expect(nodes[1].type).toBe("island");
    expect(absolutePosition(byId(nodes, "dist"), nodes)).toEqual({
      x: 300,
      y: 250,
    });
  });

  it("bundles goods between two islands into one trade route", () => {
    const { nodes, edges } = twoIslands();
    const flow = computeFlow(nodes, edges);
    expect(flow.routes).toHaveLength(1);
    expect(flow.routes[0].goods).toHaveLength(2);
    expect(flow.routeOfEdge.has("e2")).toBe(false);
  });

  it("balances workforce per island", () => {
    const { nodes, edges } = twoIslands();
    const flow = computeFlow(nodes, edges);
    const A = flow.islands.get("A")!;
    const B = flow.islands.get("B")!;
    expect(A.buildings).toBe(4);
    expect(A.exports).toHaveLength(2);
    expect(B.imports).toHaveLength(2);
    expect(A.workforce).toEqual([
      { workforce: FARMER_WORKFORCE, required: 120, provided: 0 },
    ]);
    expect(B.workforce).toEqual([
      { workforce: FARMER_WORKFORCE, required: 0, provided: 800 },
    ]);
    expect(flow.workforce.map((area) => area.island?.id)).toEqual(["A", "B"]);
  });

  it("moves a dragged node off its island and back on", () => {
    let { nodes } = twoIslands();
    const island = byId(nodes, "A");
    const moveFish = (position: { x: number; y: number }) =>
      reparent(
        nodes.map((n) => (n.id === "fish" ? { ...n, position } : n)),
        ["fish"],
      );
    nodes = moveFish({ x: -2000, y: -2000 });
    expect(byId(nodes, "fish").parentId).toBeUndefined();
    nodes = moveFish({ x: island.position.x + 40, y: island.position.y + 80 });
    expect(byId(nodes, "fish").parentId).toBe("A");
  });

  it("arranges members inside their island, suppliers on the left", () => {
    const { nodes, edges } = twoIslands();
    const arranged = arrangeNodes(nodes, edges);
    for (const n of arranged.filter((n) => n.parentId)) {
      const island = byId(arranged, n.parentId!);
      const { width, height } = nodeSize(n);
      expect(n.position.x).toBeGreaterThanOrEqual(0);
      expect(n.position.y).toBeGreaterThanOrEqual(0);
      expect(n.position.x + width).toBeLessThanOrEqual(island.width!);
      expect(n.position.y + height).toBeLessThanOrEqual(island.height!);
    }
    const A = byId(arranged, "A");
    expect(A.position.x + A.width!).toBeLessThanOrEqual(
      byId(arranged, "B").position.x,
    );
  });

  it("keeps buildings in place when an island is ungrouped", () => {
    const { nodes } = twoIslands();
    const before = absolutePosition(byId(nodes, "res"), nodes);
    const ungrouped = ungroupIsland(nodes, "B");
    expect(byId(ungrouped, "res").position).toEqual(before);
    expect(ungrouped.some((n) => n.id === "B")).toBe(false);
  });
});
