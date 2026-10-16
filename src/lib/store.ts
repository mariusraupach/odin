import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { producersOf } from "@/lib/anno";
import {
  buildingsFor,
  computeFlow,
  handleGood,
  inHandle,
  outHandle,
  type BuildingNodeData,
  type PlanEdge,
  type PlanNode,
  type ResidenceNodeData,
} from "@/lib/anno/calc";

export const PLAN_VERSION = 1;

export type Plan = {
  version: number;
  nodes: PlanNode[];
  edges: PlanEdge[];
};

export type NewNode =
  | { type: "building"; data: BuildingNodeData }
  | { type: "residence"; data: ResidenceNodeData };

type PlanState = {
  nodes: PlanNode[];
  edges: PlanEdge[];
  onNodesChange: (changes: NodeChange<PlanNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<PlanEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: NewNode, position: XYPosition) => string;
  updateNodeData: (
    id: string,
    data: Partial<BuildingNodeData & ResidenceNodeData>,
  ) => void;
  removeNode: (id: string) => void;
  addSuppliers: (id: string) => number;
  importPlan: (plan: Plan) => void;
  exportPlan: () => Plan;
  clear: () => void;
};

export function isValidConnection(
  connection: Connection | PlanEdge,
  edges: PlanEdge[],
): boolean {
  const { source, target, sourceHandle, targetHandle } = connection;
  if (source === target) return false;
  if (!sourceHandle?.startsWith("out:") || !targetHandle?.startsWith("in:"))
    return false;
  if (handleGood(sourceHandle) !== handleGood(targetHandle)) return false;
  return !edges.some(
    (e) =>
      e.source === source &&
      e.target === target &&
      e.sourceHandle === sourceHandle &&
      e.targetHandle === targetHandle,
  );
}

// crypto.randomUUID() only exists in secure contexts (HTTPS or localhost),
// so it is undefined when the app is opened over a plain-HTTP LAN address.
const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<Plan>;
  return (
    plan.version === PLAN_VERSION &&
    Array.isArray(plan.nodes) &&
    Array.isArray(plan.edges)
  );
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      onNodesChange: (changes) =>
        set({ nodes: applyNodeChanges(changes, get().nodes) }),
      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges(changes, get().edges) }),
      onConnect: (connection) => {
        if (!isValidConnection(connection, get().edges)) return;
        set({ edges: addEdge({ ...connection, type: "flow" }, get().edges) });
      },
      addNode: (node, position) => {
        const id = newId();
        set({ nodes: [...get().nodes, { ...node, id, position } as PlanNode] });
        return id;
      },
      updateNodeData: (id, data) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === id
              ? ({ ...n, data: { ...n.data, ...data } } as PlanNode)
              : n,
          ),
        }),
      removeNode: (id) =>
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        }),
      addSuppliers: (id) => {
        const { nodes, edges } = get();
        const node = nodes.find((n) => n.id === id);
        if (!node) return 0;
        const flow = computeFlow(nodes, edges).nodes.get(id);
        const missing = (flow?.inputs ?? []).filter(
          (i) => i.nominal - i.actual > 1e-6,
        );
        const newNodes: PlanNode[] = [];
        const newEdges: PlanEdge[] = [];
        missing.forEach((input, index) => {
          const producer = producersOf(input.good)[0];
          if (!producer) return;
          const supplierId = newId();
          newNodes.push({
            id: supplierId,
            type: "building",
            position: {
              x: node.position.x - 340,
              y: node.position.y + (index - (missing.length - 1) / 2) * 220,
            },
            data: {
              buildingId: producer.id,
              count: buildingsFor(input.nominal - input.actual, producer.id),
              productivity: 100,
            },
          });
          newEdges.push({
            id: `e-${newId()}`,
            type: "flow",
            source: supplierId,
            sourceHandle: outHandle(input.good),
            target: id,
            targetHandle: inHandle(input.good),
          });
        });
        set({ nodes: [...nodes, ...newNodes], edges: [...edges, ...newEdges] });
        return newNodes.length;
      },
      importPlan: (plan) => set({ nodes: plan.nodes, edges: plan.edges }),
      exportPlan: () => ({
        version: PLAN_VERSION,
        nodes: get().nodes,
        edges: get().edges,
      }),
      clear: () => set({ nodes: [], edges: [] }),
    }),
    {
      name: "anno-modeler:v1",
      version: PLAN_VERSION,
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    },
  ),
);
