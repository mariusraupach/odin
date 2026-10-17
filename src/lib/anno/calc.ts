import type { Edge, Node } from "@xyflow/react";
import { buildingsById, tiersById } from "./index";

export type BuildingNodeData = {
  buildingId: string;
  count: number;
  /** Productivity in percent, 100 = base rate. */
  productivity: number;
};

export type ResidenceNodeData = {
  tierId: string;
  houses: number;
};

export type IslandNodeData = {
  name: string;
  /** Any CSS colour; tints the island area. */
  color: string;
};

export type BuildingNode = Node<BuildingNodeData, "building">;
export type ResidenceNode = Node<ResidenceNodeData, "residence">;
/** A container: buildings and residences on it have it as `parentId`. */
export type IslandNode = Node<IslandNodeData, "island">;
export type PlanNode = BuildingNode | ResidenceNode | IslandNode;
export type PlanEdge = Edge;

export function nodeTitle(node: PlanNode): string {
  if (node.type === "building")
    return buildingsById.get(node.data.buildingId)?.name ?? "Building";
  if (node.type === "residence")
    return `${tiersById.get(node.data.tierId)?.name ?? "Residence"} (${node.data.houses} houses)`;
  return node.data.name;
}

export const inHandle = (good: string) => `in:${good}`;
export const outHandle = (good: string) => `out:${good}`;
export const handleGood = (handle: string | null | undefined) =>
  handle?.split(":")[1] ?? "";

export type PortRate = {
  good: string;
  /** Rate at full input supply (t/min). */
  nominal: number;
  /** Rate that actually flows through connected edges (t/min). */
  actual: number;
};

export type NodeFlow = {
  inputs: PortRate[];
  outputs: PortRate[];
  /** Fraction of nominal output the node manages given its inputs (0..1). */
  efficiency: number;
};

export type EdgeFlow = {
  rate: number;
  requested: number;
};

export type GoodBalance = {
  good: string;
  produced: number;
  consumed: number;
};

export type WorkforceBalance = {
  workforce: string;
  required: number;
  provided: number;
};

export type GoodRate = { good: string; rate: number };

export type IslandStats = {
  workforce: WorkforceBalance[];
  /** Total buildings (sum of node counts) on the island. */
  buildings: number;
  /** Goods shipped to other islands, t/min. */
  exports: GoodRate[];
  /** Goods shipped in from other islands, t/min. */
  imports: GoodRate[];
};

/** All goods shipped from one island to another, bundled into one route. */
export type TradeRoute = {
  key: string;
  from: string;
  to: string;
  goods: GoodRate[];
  edgeIds: string[];
};

export type FlowResult = {
  nodes: Map<string, NodeFlow>;
  edges: Map<string, EdgeFlow>;
  goods: GoodBalance[];
  workforce: WorkforceBalance[];
  islands: Map<string, IslandStats>;
  routes: TradeRoute[];
  routeOfEdge: Map<string, TradeRoute>;
};

type Ports = { inputs: Map<string, number>; outputs: Map<string, number> };

/** Rates a node consumes and produces at full input supply. */
export function nominalPorts(node: PlanNode): Ports {
  const inputs = new Map<string, number>();
  const outputs = new Map<string, number>();
  if (node.type === "building") {
    const building = buildingsById.get(node.data.buildingId);
    if (building) {
      const base =
        building.tpmin * node.data.count * (node.data.productivity / 100);
      for (const i of building.inputs) inputs.set(i.good, base * i.amount);
      for (const o of building.outputs) outputs.set(o.good, base * o.amount);
    }
  } else if (node.type === "residence") {
    const tier = tiersById.get(node.data.tierId);
    if (tier) {
      const residents = node.data.houses * tier.residentsPerHouse;
      for (const n of tier.needs)
        inputs.set(n.good, residents * n.perResidentPerMinute);
    }
  }
  return { inputs, outputs };
}

const EPSILON = 1e-9;

function addRate(list: GoodRate[] | undefined, good: string, rate: number) {
  if (!list) return;
  const entry = list.find((g) => g.good === good);
  if (entry) entry.rate += rate;
  else list.push({ good, rate });
}

/** Workforce required by buildings vs. provided by residences. */
export function workforceBalance(nodes: PlanNode[]): WorkforceBalance[] {
  const workforce = new Map<string, WorkforceBalance>();
  const entry = (id: string) => {
    if (!workforce.has(id))
      workforce.set(id, { workforce: id, required: 0, provided: 0 });
    return workforce.get(id)!;
  };
  for (const node of nodes) {
    if (node.type === "building") {
      const wf = buildingsById.get(node.data.buildingId)?.workforce;
      if (wf) entry(wf.type).required += wf.count * node.data.count;
    } else if (node.type === "residence") {
      const tier = tiersById.get(node.data.tierId);
      if (tier)
        entry(tier.workforce).provided +=
          node.data.houses * tier.residentsPerHouse;
    }
  }
  return [...workforce.values()];
}

/**
 * Propagates goods through the graph. Each consumer input splits its demand
 * evenly across incoming edges; a producer short on supply scales all of its
 * outgoing edges down proportionally. Buildings with unmet inputs produce
 * less, which is iterated until the graph settles.
 */
/**
 * Splits supply across edges. First every consumer spreads its unmet demand
 * evenly over suppliers that still have spare output (suppliers short on
 * output scale down proportionally), repeated until nothing moves. Then
 * augmenting paths reroute flow so no satisfiable demand is left unmet: a
 * consumer can take over a busy supplier's share if that frees it up for a
 * consumer with no other source.
 */
function allocate(
  edges: PlanEdge[],
  supplyOf: (e: PlanEdge) => number,
  demandOf: (e: PlanEdge) => number,
): Map<string, number> {
  const flow = new Map(edges.map((e) => [e.id, 0]));
  const sourceKey = (e: PlanEdge) => `${e.source}|${e.sourceHandle}`;
  const targetKey = (e: PlanEdge) => `${e.target}|${e.targetHandle}`;

  const capacity = new Map<string, number>();
  const demand = new Map<string, number>();
  const bySource = new Map<string, PlanEdge[]>();
  const byTarget = new Map<string, PlanEdge[]>();
  for (const e of edges) {
    capacity.set(sourceKey(e), supplyOf(e));
    demand.set(targetKey(e), demandOf(e));
    bySource.set(sourceKey(e), [...(bySource.get(sourceKey(e)) ?? []), e]);
    byTarget.set(targetKey(e), [...(byTarget.get(targetKey(e)) ?? []), e]);
  }

  const sum = (list: PlanEdge[] | undefined) =>
    (list ?? []).reduce((total, e) => total + flow.get(e.id)!, 0);
  const spare = (key: string) => capacity.get(key)! - sum(bySource.get(key));
  const unmet = (key: string) => demand.get(key)! - sum(byTarget.get(key));

  // Phase 1: fair, proportional sharing.
  for (let round = 0; round < 20; round++) {
    const ask = new Map<string, number>();
    for (const [key, group] of byTarget) {
      const open = group.filter((e) => spare(sourceKey(e)) > EPSILON);
      const missing = unmet(key);
      if (missing <= EPSILON || open.length === 0) continue;
      for (const e of open) ask.set(e.id, missing / open.length);
    }
    let moved = 0;
    for (const [key, group] of bySource) {
      const asked = group.reduce((total, e) => total + (ask.get(e.id) ?? 0), 0);
      if (asked <= EPSILON) continue;
      const scale = Math.min(1, spare(key) / asked);
      for (const e of group) {
        const add = (ask.get(e.id) ?? 0) * scale;
        flow.set(e.id, flow.get(e.id)! + add);
        moved += add;
      }
    }
    if (moved <= EPSILON) break;
  }

  // Phase 2: augmenting paths (supplier -> consumer -> other supplier ...).
  for (let round = 0; round < 1000; round++) {
    type Step = { edge: PlanEdge; forward: boolean };
    const cameFrom = new Map<string, { prev: string; step: Step } | null>();
    const queue: string[] = [];
    for (const key of bySource.keys()) {
      if (spare(key) > EPSILON) {
        cameFrom.set(`s:${key}`, null);
        queue.push(`s:${key}`);
      }
    }
    let end: string | null = null;
    while (queue.length > 0 && !end) {
      const current = queue.shift()!;
      const key = current.slice(2);
      if (current.startsWith("s:")) {
        for (const e of bySource.get(key) ?? []) {
          const next = `t:${targetKey(e)}`;
          if (cameFrom.has(next)) continue;
          cameFrom.set(next, {
            prev: current,
            step: { edge: e, forward: true },
          });
          if (unmet(targetKey(e)) > EPSILON) {
            end = next;
            break;
          }
          queue.push(next);
        }
      } else {
        // Undo part of another supplier's delivery to this consumer.
        for (const e of byTarget.get(key) ?? []) {
          const next = `s:${sourceKey(e)}`;
          if (flow.get(e.id)! <= EPSILON || cameFrom.has(next)) continue;
          cameFrom.set(next, {
            prev: current,
            step: { edge: e, forward: false },
          });
          queue.push(next);
        }
      }
    }
    if (!end) break;

    const path: Step[] = [];
    let node = end;
    let start = end;
    while (cameFrom.get(node)) {
      const { prev, step } = cameFrom.get(node)!;
      path.unshift(step);
      node = prev;
      start = prev;
    }
    let amount = Math.min(spare(start.slice(2)), unmet(end.slice(2)));
    for (const step of path) {
      if (!step.forward) amount = Math.min(amount, flow.get(step.edge.id)!);
    }
    if (amount <= EPSILON) break;
    for (const step of path) {
      const delta = step.forward ? amount : -amount;
      flow.set(step.edge.id, flow.get(step.edge.id)! + delta);
    }
  }

  return flow;
}

export function computeFlow(
  nodes: PlanNode[],
  edges: PlanEdge[],
  /**
   * Treat every building as fully supplied, i.e. what the graph would move
   * if upstream shortages were fixed.
   */
  { assumeFullInputs = false } = {},
): FlowResult {
  const ports = new Map(nodes.map((n) => [n.id, nominalPorts(n)]));
  const efficiency = new Map(nodes.map((n) => [n.id, 1]));

  const incoming = new Map<string, PlanEdge[]>();
  for (const e of edges) {
    const key = `${e.target}|${e.targetHandle}`;
    incoming.set(key, [...(incoming.get(key) ?? []), e]);
  }

  const supplyOf = (e: PlanEdge) =>
    (ports.get(e.source)?.outputs.get(handleGood(e.sourceHandle)) ?? 0) *
    (efficiency.get(e.source) ?? 0);
  const demandOf = (e: PlanEdge) =>
    ports.get(e.target)?.inputs.get(handleGood(e.targetHandle)) ?? 0;

  let flows = new Map<string, number>();
  for (let iteration = 0; iteration < 50; iteration++) {
    flows = allocate(edges, supplyOf, demandOf);
    if (assumeFullInputs) break;

    let changed = false;
    for (const node of nodes) {
      if (node.type !== "building") continue;
      let next = 1;
      for (const [good, demand] of ports.get(node.id)!.inputs) {
        if (demand <= EPSILON) continue;
        const received = (
          incoming.get(`${node.id}|${inHandle(good)}`) ?? []
        ).reduce((sum, e) => sum + (flows.get(e.id) ?? 0), 0);
        next = Math.min(next, received / demand);
      }
      if (Math.abs(next - efficiency.get(node.id)!) > 1e-6) changed = true;
      efficiency.set(node.id, next);
    }
    if (!changed) break;
  }

  // An edge "asks" for what it carries plus its share of the consumer's
  // remaining shortfall, so it only shows as short when the consumer is.
  const requested = new Map<string, number>();
  for (const group of incoming.values()) {
    const received = group.reduce((sum, e) => sum + (flows.get(e.id) ?? 0), 0);
    const unmet = Math.max(0, demandOf(group[0]) - received);
    for (const e of group) {
      requested.set(e.id, (flows.get(e.id) ?? 0) + unmet / group.length);
    }
  }

  const nodeFlows = new Map<string, NodeFlow>();
  for (const node of nodes) {
    const { inputs, outputs } = ports.get(node.id)!;
    const sumEdges = (list: PlanEdge[] | undefined) =>
      (list ?? []).reduce((sum, e) => sum + (flows.get(e.id) ?? 0), 0);
    const eff = efficiency.get(node.id)!;
    nodeFlows.set(node.id, {
      efficiency: eff,
      inputs: [...inputs].map(([good, nominal]) => ({
        good,
        nominal,
        actual: sumEdges(incoming.get(`${node.id}|${inHandle(good)}`)),
      })),
      outputs: [...outputs].map(([good, nominal]) => ({
        good,
        nominal,
        actual: nominal * eff,
      })),
    });
  }

  const edgeFlows = new Map<string, EdgeFlow>();
  for (const e of edges) {
    edgeFlows.set(e.id, {
      rate: flows.get(e.id) ?? 0,
      requested: requested.get(e.id) ?? 0,
    });
  }

  // Plan-wide totals ignore edges: what would the plan produce vs. consume.
  const goods = new Map<string, GoodBalance>();
  const goodEntry = (good: string) => {
    if (!goods.has(good)) goods.set(good, { good, produced: 0, consumed: 0 });
    return goods.get(good)!;
  };
  for (const { inputs, outputs } of ports.values()) {
    for (const [good, rate] of outputs) goodEntry(good).produced += rate;
    for (const [good, rate] of inputs) goodEntry(good).consumed += rate;
  }

  // Workforce and trade are per island: workers do not commute by ship.
  const islandIds = nodes.filter((n) => n.type === "island").map((n) => n.id);
  const islands = new Map<string, IslandStats>();
  for (const islandId of islandIds) {
    const members = nodes.filter((n) => n.parentId === islandId);
    islands.set(islandId, {
      workforce: workforceBalance(members),
      buildings: members.reduce(
        (sum, n) => sum + (n.type === "building" ? n.data.count : 0),
        0,
      ),
      exports: [],
      imports: [],
    });
  }

  const islandOf = new Map(nodes.map((n) => [n.id, n.parentId]));
  const routes = new Map<string, TradeRoute>();
  const routeOfEdge = new Map<string, TradeRoute>();
  for (const e of edges) {
    const from = islandOf.get(e.source);
    const to = islandOf.get(e.target);
    if (!from || !to || from === to) continue;
    const key = `${from}->${to}`;
    if (!routes.has(key)) {
      routes.set(key, { key, from, to, goods: [], edgeIds: [] });
    }
    const route = routes.get(key)!;
    route.edgeIds.push(e.id);
    const good = handleGood(e.sourceHandle);
    const rate = flows.get(e.id) ?? 0;
    const entry = route.goods.find((g) => g.good === good);
    if (entry) entry.rate += rate;
    else route.goods.push({ good, rate });
    routeOfEdge.set(e.id, route);
  }
  for (const route of routes.values()) {
    for (const { good, rate } of route.goods) {
      addRate(islands.get(route.from)?.exports, good, rate);
      addRate(islands.get(route.to)?.imports, good, rate);
    }
  }

  return {
    nodes: nodeFlows,
    edges: edgeFlows,
    goods: [...goods.values()],
    workforce: workforceBalance(nodes),
    islands,
    routes: [...routes.values()],
    routeOfEdge,
  };
}

export type Status = "ok" | "low" | "none";

export function rateStatus(actual: number, target: number): Status {
  if (target <= EPSILON) return "ok";
  const ratio = actual / target;
  if (ratio >= 0.999) return "ok";
  return ratio > EPSILON ? "low" : "none";
}

export type BalanceStatus = Status | "surplus";

/** Below this, a surplus rounds to 0.00 on screen and counts as balanced. */
export const BALANCE_TOLERANCE = 0.005;

/** Like rateStatus, but tells an exact match apart from overproduction. */
export function balanceStatus(
  produced: number,
  consumed: number,
): BalanceStatus {
  if (produced - consumed > BALANCE_TOLERANCE) return "surplus";
  if (Math.abs(produced - consumed) <= BALANCE_TOLERANCE) return "ok";
  return rateStatus(produced, consumed);
}

export function formatRate(rate: number) {
  return rate >= 10 ? rate.toFixed(1) : rate.toFixed(2);
}

/** Buildings needed to cover a rate, rounded up. */
export function buildingsFor(
  rate: number,
  buildingId: string,
  productivity = 100,
) {
  const building = buildingsById.get(buildingId);
  if (!building || building.tpmin <= 0) return 1;
  return Math.max(
    1,
    Math.ceil(rate / (building.tpmin * (productivity / 100)) - 1e-6),
  );
}
