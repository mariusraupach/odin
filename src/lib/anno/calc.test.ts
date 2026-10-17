import { describe, expect, it } from "vitest";
import { BUILDING, building, edge, GOOD, residence } from "@/test/plan";
import { buildingsFor, computeFlow } from "./calc";

describe("computeFlow", () => {
  it("rates a fishery at 2 t/min and ships it all to farmers", () => {
    const flow = computeFlow(
      [building("f", BUILDING.fishery), residence("h", 80)],
      [edge("e", "f", "h", GOOD.fish)],
    );
    expect(flow.nodes.get("f")!.outputs[0].nominal).toBe(2);
    expect(flow.edges.get("e")!.rate).toBeCloseTo(2);
  });

  it("runs a building at the share of inputs it receives", () => {
    const flow = computeFlow(
      [
        building("s", BUILDING.sheepFarm, 1, undefined, 50),
        building("k", BUILDING.frameworkKnitters),
        residence("h", 100),
      ],
      [edge("a", "s", "k", GOOD.wool), edge("b", "k", "h", GOOD.workClothes)],
    );
    expect(flow.nodes.get("k")!.efficiency).toBeCloseTo(0.5);
  });

  it("splits iron so both consumers are fully supplied", () => {
    const flow = computeFlow(
      [
        building("A", BUILDING.ironMine, 2),
        building("B", BUILDING.ironMine, 1),
        building("F", BUILDING.furnace, 4),
        building("C", BUILDING.cannery, 1),
        building("coal", BUILDING.coalMine, 2),
        building("kitchen", BUILDING.artisanalKitchen, 2),
      ],
      [
        edge("A-F", "A", "F", GOOD.iron),
        edge("A-C", "A", "C", GOOD.iron),
        edge("B-C", "B", "C", GOOD.iron),
        edge("coal-F", "coal", "F", GOOD.coal),
        edge("k-C", "kitchen", "C", GOOD.goulash),
      ],
    );
    expect(flow.nodes.get("F")!.efficiency).toBeCloseTo(1);
    const iron = flow.nodes.get("C")!.inputs.find((p) => p.good === GOOD.iron)!;
    expect(iron.actual).toBeCloseTo(iron.nominal);
    for (const id of ["A-F", "A-C", "B-C"]) {
      const { rate, requested } = flow.edges.get(id)!;
      expect(rate).toBeCloseTo(requested);
    }
  });

  it("reroutes supply so a consumer with one source is not left short", () => {
    // S1 feeds A and B, S2 only B; both need 2 t/min.
    const flow = computeFlow(
      [
        building("S1", BUILDING.fishery),
        building("S2", BUILDING.fishery),
        residence("A", 80),
        residence("B", 80),
      ],
      [
        edge("S1-A", "S1", "A", GOOD.fish),
        edge("S1-B", "S1", "B", GOOD.fish),
        edge("S2-B", "S2", "B", GOOD.fish),
      ],
    );
    expect(flow.nodes.get("A")!.inputs[0].actual).toBeCloseTo(2);
    expect(flow.nodes.get("B")!.inputs[0].actual).toBeCloseTo(2);
  });

  it("shares a real shortage evenly and marks the edges as short", () => {
    const flow = computeFlow(
      [building("S", BUILDING.fishery), residence("A", 80), residence("B", 80)],
      [edge("S-A", "S", "A", GOOD.fish), edge("S-B", "S", "B", GOOD.fish)],
    );
    expect(flow.edges.get("S-A")!.rate).toBeCloseTo(1);
    expect(flow.edges.get("S-B")!.rate).toBeCloseTo(1);
    expect(flow.edges.get("S-A")!.requested).toBeGreaterThan(1);
  });
});

describe("buildingsFor", () => {
  it("rounds up to whole buildings", () => {
    // 1000 farmers wear 3.08 t/min of work clothes; one knitter makes 2.
    expect(buildingsFor(1000 * 0.003076926, BUILDING.frameworkKnitters)).toBe(
      2,
    );
  });
});
