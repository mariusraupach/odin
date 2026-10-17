import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BUILDING, building, GOOD, residence } from "@/test/plan";
import { usePlanStore } from "./store";

const store = () => usePlanStore.getState();
const history = () => usePlanStore.temporal.getState();
const fishCount = () =>
  (store().nodes.find((n) => n.id === "fish")!.data as { count: number }).count;
// Let the current burst of changes end.
const pause = () => vi.advanceTimersByTime(1000);
const connectFish = () =>
  store().onConnect({
    source: "fish",
    target: "res",
    sourceHandle: `out:${GOOD.fish}`,
    targetHandle: `in:${GOOD.fish}`,
  });

describe("undo/redo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlanStore.setState({
      nodes: [building("fish", BUILDING.fishery), residence("res", 80)],
      edges: [],
    });
    pause();
    history().clear();
  });
  afterEach(() => vi.useRealTimers());

  it("undoes and redoes a change", () => {
    store().updateNodeData("fish", { count: 5 });
    history().undo();
    expect(fishCount()).toBe(1);
    history().redo();
    expect(fishCount()).toBe(5);
  });

  it("restores deleted nodes with their connections", () => {
    connectFish();
    pause();
    store().removeNodes(["fish"]);
    expect(store().edges).toHaveLength(0);
    history().undo();
    expect(store().nodes.map((n) => n.id)).toEqual(["fish", "res"]);
    expect(store().edges).toHaveLength(1);
  });

  it("treats quick successive changes as one step", () => {
    store().updateNodeData("fish", { count: 2 });
    store().updateNodeData("fish", { count: 12 });
    expect(history().pastStates).toHaveLength(1);
    history().undo();
    expect(fishCount()).toBe(1);
  });

  it("keeps separate steps for changes further apart", () => {
    store().updateNodeData("fish", { count: 2 });
    pause();
    store().updateNodeData("fish", { count: 3 });
    history().undo();
    expect(fishCount()).toBe(2);
  });

  it("does not record selection or measuring", () => {
    store().selectNodes(["fish"]);
    store().onNodesChange([
      {
        type: "dimensions",
        id: "fish",
        dimensions: { width: 256, height: 180 },
      },
    ]);
    expect(history().pastStates).toHaveLength(0);
  });

  it("drops the redo stack after a new change", () => {
    store().updateNodeData("fish", { count: 2 });
    pause();
    history().undo();
    connectFish();
    expect(history().futureStates).toHaveLength(0);
  });
});
