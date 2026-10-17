import type { XYPosition } from "@xyflow/react";
import {
  buildingsFor,
  inHandle,
  outHandle,
  type IslandNode,
  type PlanEdge,
  type PlanNode,
  type WorkforceBalance,
} from "./calc";
import {
  buildingsById,
  goodName,
  producersOf,
  tiersById,
  type Building,
} from "./index";
import {
  absolutePosition,
  newIsland,
  nodeSize,
  sortParentsFirst,
} from "./islands";
import { arrangeNodes } from "./layout";

/** What to build a production chain for. */
export type Goal =
  | { kind: "residents"; tierId: string; houses: number }
  | { kind: "good"; good: string; rate: number };

export type PlannedBuilding = {
  buildingId: string;
  /** Output the chain needs from it, t/min of its primary good. */
  rate: number;
  count: number;
};

/** `from` supplies `good` to `to`; `to` is null for the goal's residences. */
export type PlannedLink = { good: string; from: string; to: string | null };

export type PlannedChain = {
  /** Starting at the goal's producers, working back towards raw goods. */
  buildings: PlannedBuilding[];
  links: PlannedLink[];
  /** Goods the chain needs that no building here can make. */
  unavailable: string[];
  workforce: WorkforceBalance[];
};

/**
 * Sizes the full chain for a goal. Every good is made by its first producer
 * (Old World first), shared intermediates like Grain get one combined entry,
 * and each building is sized for what its consumers draw when they run at
 * full capacity, so the whole chain runs at 100% as built in the game.
 */
export function planChain(goal: Goal): PlannedChain {
  const demand = new Map<string, number>();
  const addDemand = (good: string, rate: number) =>
    demand.set(good, (demand.get(good) ?? 0) + rate);

  if (goal.kind === "residents") {
    const tier = tiersById.get(goal.tierId);
    const residents = goal.houses * (tier?.residentsPerHouse ?? 0);
    for (const need of tier?.needs ?? [])
      addDemand(need.good, residents * need.perResidentPerMinute);
  } else {
    addDemand(goal.good, goal.rate);
  }

  // Which building makes each good, found by walking back from the goal.
  // Consumers come before their producers, so a good's demand is complete
  // by the time its producer is sized.
  const producerOf = new Map<string, Building>();
  const order: Building[] = [];
  const links = new Map<string, PlannedLink>();
  const unavailable = new Set<string>();
  const visit = (good: string, consumer: string | null) => {
    const producer = producerOf.get(good) ?? producersOf(good)[0];
    if (!producer) {
      unavailable.add(good);
      return;
    }
    links.set(`${good}|${consumer}`, { good, from: producer.id, to: consumer });
    if (producerOf.has(good)) return;
    producerOf.set(good, producer);
    for (const input of producer.inputs) visit(input.good, producer.id);
    order.unshift(producer);
  };
  for (const good of demand.keys()) visit(good, null);

  const buildings = order.map((producer) => {
    // Rates are per unit of the primary output.
    const rate = producer.outputs.reduce(
      (sum, o) => sum + (demand.get(o.good) ?? 0) / o.amount,
      0,
    );
    const count = buildingsFor(rate, producer.id);
    for (const input of producer.inputs)
      addDemand(input.good, count * producer.tpmin * input.amount);
    return { buildingId: producer.id, rate, count };
  });

  const workforce = new Map<string, WorkforceBalance>();
  for (const { buildingId, count } of buildings) {
    const wf = buildingsById.get(buildingId)?.workforce;
    if (!wf) continue;
    const entry = workforce.get(wf.type) ?? {
      workforce: wf.type,
      required: 0,
      provided: 0,
    };
    entry.required += wf.count * count;
    workforce.set(wf.type, entry);
  }

  return {
    buildings,
    links: [...links.values()],
    unavailable: [...unavailable],
    workforce: [...workforce.values()],
  };
}

export const goalName = (goal: Goal) =>
  goal.kind === "residents"
    ? (tiersById.get(goal.tierId)?.name ?? "Residents")
    : goodName(goal.good);

// Cards are not rendered yet when the chain is laid out, so guess their size
// from the number of goods rows.
function estimatedSize(node: PlanNode) {
  if (node.type === "island") return nodeSize(node);
  const rows =
    node.type === "building"
      ? (buildingsById.get(node.data.buildingId)?.inputs.length ?? 0) +
        (buildingsById.get(node.data.buildingId)?.outputs.length ?? 0)
      : (tiersById.get(node.data.tierId)?.needs.length ?? 0);
  return { width: 256, height: 130 + rows * 24 };
}

/** Top-left corner for something placed to the right of the whole plan. */
function besidePlan(nodes: PlanNode[]): XYPosition {
  const topLevel = nodes.filter((n) => !n.parentId);
  if (topLevel.length === 0) return { x: 0, y: 0 };
  return {
    x:
      Math.max(
        ...topLevel.map(
          (n) => absolutePosition(n, nodes).x + nodeSize(n).width,
        ),
      ) + 200,
    y: Math.min(...topLevel.map((n) => n.position.y)),
  };
}

/**
 * Turns a planned chain into nodes and edges laid out to the right of the
 * existing plan. With `ownIsland`, the chain goes on a new island named
 * after the goal, and New World buildings on a second one.
 */
export function chainToPlan(
  goal: Goal,
  chain: PlannedChain,
  existing: PlanNode[],
  { ownIsland, newId }: { ownIsland: boolean; newId: () => string },
): { nodes: PlanNode[]; edges: PlanEdge[] } {
  const origin = { x: 0, y: 0 };
  const idOf = new Map(chain.buildings.map((b) => [b.buildingId, newId()]));
  const nodes: PlanNode[] = chain.buildings.map(({ buildingId, count }) => ({
    id: idOf.get(buildingId)!,
    type: "building",
    position: origin,
    data: { buildingId, count, productivity: 100 },
  }));
  const residenceId = newId();
  if (goal.kind === "residents") {
    nodes.push({
      id: residenceId,
      type: "residence",
      position: origin,
      data: { tierId: goal.tierId, houses: goal.houses },
    });
  }

  // A good goal has no consumer node: its producers' output is the result.
  const edges: PlanEdge[] = chain.links
    .filter((link) => link.to || goal.kind === "residents")
    .map((link) => ({
      id: `e-${newId()}`,
      type: "flow",
      source: idOf.get(link.from)!,
      target: link.to ? idOf.get(link.to)! : residenceId,
      sourceHandle: outHandle(link.good),
      targetHandle: inHandle(link.good),
    }));

  const islands: IslandNode[] = [];
  if (ownIsland) {
    const isNewWorld = (n: PlanNode) =>
      n.type === "building" &&
      buildingsById.get(n.data.buildingId)?.region === "new-world";
    for (const [name, members] of [
      [goalName(goal), nodes.filter((n) => !isNewWorld(n))],
      [`${goalName(goal)} · New World`, nodes.filter(isNewWorld)],
    ] as const) {
      if (members.length === 0) continue;
      const island = newIsland([...existing, ...islands], newId(), origin);
      island.data = { ...island.data, name };
      islands.push(island);
      for (const member of members) member.parentId = island.id;
    }
  }

  // Lay the chain out on its own, then move it beside the existing plan.
  const arranged = arrangeNodes(
    sortParentsFirst([...islands, ...nodes]),
    edges,
    estimatedSize,
  );
  const topLevel = arranged.filter((n) => !n.parentId);
  const start = besidePlan(existing);
  const dx = start.x - Math.min(...topLevel.map((n) => n.position.x));
  const dy = start.y - Math.min(...topLevel.map((n) => n.position.y));
  return {
    nodes: arranged.map((n) =>
      n.parentId
        ? n
        : { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } },
    ),
    edges,
  };
}
