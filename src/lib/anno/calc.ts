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

export type BuildingNode = Node<BuildingNodeData, "building">;
export type ResidenceNode = Node<ResidenceNodeData, "residence">;
export type PlanNode = BuildingNode | ResidenceNode;
export type PlanEdge = Edge;

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

export type FlowResult = {
  nodes: Map<string, NodeFlow>;
  edges: Map<string, EdgeFlow>;
  goods: GoodBalance[];
  workforce: WorkforceBalance[];
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
  } else {
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

/**
 * Propagates goods through the graph. Each consumer input splits its demand
 * evenly across incoming edges; a producer short on supply scales all of its
 * outgoing edges down proportionally. Buildings with unmet inputs produce
 * less, which is iterated until the graph settles.
 */
export function computeFlow(nodes: PlanNode[], edges: PlanEdge[]): FlowResult {
  const ports = new Map(nodes.map((n) => [n.id, nominalPorts(n)]));
  const efficiency = new Map(nodes.map((n) => [n.id, 1]));

  const incoming = new Map<string, PlanEdge[]>();
  for (const e of edges) {
    const key = `${e.target}|${e.targetHandle}`;
    incoming.set(key, [...(incoming.get(key) ?? []), e]);
  }

  const requested = new Map<string, number>();
  for (const e of edges) {
    const demand =
      ports.get(e.target)?.inputs.get(handleGood(e.targetHandle)) ?? 0;
    const siblings = incoming.get(`${e.target}|${e.targetHandle}`)?.length ?? 1;
    requested.set(e.id, demand / siblings);
  }

  const outgoing = new Map<string, PlanEdge[]>();
  for (const e of edges) {
    const key = `${e.source}|${e.sourceHandle}`;
    outgoing.set(key, [...(outgoing.get(key) ?? []), e]);
  }

  let flows = new Map<string, number>();
  for (let iteration = 0; iteration < 50; iteration++) {
    flows = new Map();
    for (const [key, group] of outgoing) {
      const [source, handle] = key.split("|");
      const supply =
        (ports.get(source)?.outputs.get(handleGood(handle)) ?? 0) *
        (efficiency.get(source) ?? 0);
      const asked = group.reduce(
        (sum, e) => sum + (requested.get(e.id) ?? 0),
        0,
      );
      const scale = asked > EPSILON ? Math.min(1, supply / asked) : 0;
      for (const e of group)
        flows.set(e.id, (requested.get(e.id) ?? 0) * scale);
    }

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

  const workforce = new Map<string, WorkforceBalance>();
  const workforceEntry = (id: string) => {
    if (!workforce.has(id))
      workforce.set(id, { workforce: id, required: 0, provided: 0 });
    return workforce.get(id)!;
  };
  for (const node of nodes) {
    if (node.type === "building") {
      const wf = buildingsById.get(node.data.buildingId)?.workforce;
      if (wf) workforceEntry(wf.type).required += wf.count * node.data.count;
    } else {
      const tier = tiersById.get(node.data.tierId);
      if (tier)
        workforceEntry(tier.workforce).provided +=
          node.data.houses * tier.residentsPerHouse;
    }
  }

  return {
    nodes: nodeFlows,
    edges: edgeFlows,
    goods: [...goods.values()],
    workforce: [...workforce.values()],
  };
}

export type Status = "ok" | "low" | "none";

export function rateStatus(actual: number, target: number): Status {
  if (target <= EPSILON) return "ok";
  const ratio = actual / target;
  if (ratio >= 0.999) return "ok";
  return ratio > EPSILON ? "low" : "none";
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
