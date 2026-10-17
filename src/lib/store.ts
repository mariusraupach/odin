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
import { buildingsById, producersOf } from "@/lib/anno";
import {
  buildingsFor,
  computeFlow,
  handleGood,
  inHandle,
  outHandle,
  spareOutput,
  type BuildingNode,
  type BuildingNodeData,
  type IslandNodeData,
  type PlanEdge,
  type PlanNode,
  type ResidenceNodeData,
} from "@/lib/anno/calc";
import {
  detach,
  groupIntoIsland,
  isIsland,
  newIsland,
  placeAt,
  reparent,
  sortParentsFirst,
  ungroupIsland,
} from "@/lib/anno/islands";
import { arrangeNodes } from "@/lib/anno/layout";

export const PLAN_VERSION = 1;

export type Plan = {
  version: number;
  nodes: PlanNode[];
  edges: PlanEdge[];
};

export type SupplierResult = {
  /** Existing producers with spare output that got connected. */
  connected: number;
  /** Existing producers whose building count was raised. */
  expanded: number;
  /** New producer nodes. */
  added: number;
  /** Suppliers of the node that are short on their own inputs. */
  starved: number;
};

export function describeSuppliers({
  connected,
  expanded,
  added,
  starved,
}: SupplierResult) {
  const text = [
    connected && `connected ${connected} existing`,
    expanded && `expanded ${expanded} existing`,
    added && `added ${added} new`,
  ]
    .filter(Boolean)
    .join(", ");
  const total = connected + expanded + added;
  const changes = text
    ? `${text[0].toUpperCase()}${text.slice(1)} supplier${total === 1 ? "" : "s"}`
    : "No new suppliers needed";
  if (!starved) return changes;
  const one = starved === 1;
  return `${changes}. ${starved} supplier${one ? " is" : "s are"} short on ${one ? "its" : "their"} own inputs: add suppliers to ${one ? "it" : "them"} too.`;
}

export type PaletteGrouping = "tier" | "workforce";

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
    data: Partial<BuildingNodeData & ResidenceNodeData & IslandNodeData>,
  ) => void;
  removeNodes: (ids: string[]) => void;
  /** Copies nodes (and edges between them) and selects the copies. */
  duplicateNodes: (ids: string[]) => void;
  selectAll: () => void;
  /** Selects exactly these nodes. */
  selectNodes: (ids: string[]) => void;
  addSuppliers: (id: string) => SupplierResult;
  /** Creates an empty island with its top-left corner at the point. */
  addIsland: (position: XYPosition) => string;
  groupIntoIsland: (ids: string[]) => void;
  /** Deletes the island but keeps its buildings on the canvas. */
  ungroupIsland: (id: string) => void;
  removeFromIsland: (ids: string[]) => void;
  /** Moves dragged nodes into or out of the island they were dropped on. */
  reparentNodes: (ids: string[]) => void;
  /** Re-sort the whole canvas automatically when nodes or edges change. */
  autoArrange: boolean;
  /** How the building palette groups buildings. */
  paletteGrouping: PaletteGrouping;
  setPaletteGrouping: (grouping: PaletteGrouping) => void;
  setAutoArrange: (autoArrange: boolean) => void;
  arrange: () => void;
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
        // Dropped onto an island: the node joins it.
        set({
          nodes: sortParentsFirst([
            ...get().nodes,
            { ...node, id, ...placeAt(position, get().nodes) } as PlanNode,
          ]),
        });
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
      removeNodes: (ids) => {
        // Deleting an island deletes what is on it.
        const remove = new Set(ids);
        for (const n of get().nodes) {
          if (n.parentId && remove.has(n.parentId)) remove.add(n.id);
        }
        set({
          nodes: get().nodes.filter((n) => !remove.has(n.id)),
          edges: get().edges.filter(
            (e) => !remove.has(e.source) && !remove.has(e.target),
          ),
        });
      },
      duplicateNodes: (ids) => {
        const { nodes, edges } = get();
        const originals = nodes.filter(
          (n) => ids.includes(n.id) && !isIsland(n),
        );
        const copies = new Map(originals.map((n) => [n.id, newId()]));
        set({
          nodes: [
            ...nodes.map((n) => ({ ...n, selected: false }) as PlanNode),
            ...originals.map(
              (n) =>
                ({
                  ...n,
                  id: copies.get(n.id)!,
                  position: { x: n.position.x + 40, y: n.position.y + 40 },
                  selected: true,
                }) as PlanNode,
            ),
          ],
          edges: [
            ...edges,
            ...edges
              .filter((e) => copies.has(e.source) && copies.has(e.target))
              .map((e) => ({
                ...e,
                id: `e-${newId()}`,
                source: copies.get(e.source)!,
                target: copies.get(e.target)!,
                selected: false,
              })),
          ],
        });
      },
      selectNodes: (ids) => {
        const keep = new Set(ids);
        set({
          nodes: get().nodes.map(
            (n) => ({ ...n, selected: keep.has(n.id) }) as PlanNode,
          ),
        });
      },
      selectAll: () =>
        set({
          nodes: get().nodes.map((n) => ({ ...n, selected: true }) as PlanNode),
        }),
      addSuppliers: (id) => {
        const { nodes, edges } = get();
        const result: SupplierResult = {
          connected: 0,
          expanded: 0,
          added: 0,
          starved: 0,
        };
        const node = nodes.find((n) => n.id === id);
        if (!node) return result;
        // Plan against what producers would make if fully supplied: a
        // producer starved of its own inputs needs suppliers itself, and
        // growing it would not help.
        const flow = computeFlow(nodes, edges, { assumeFullInputs: true });
        const missing = (flow.nodes.get(id)?.inputs ?? []).filter(
          (i) => i.nominal - i.actual > 1e-6,
        );

        const nextNodes = [...nodes];
        const newEdges: PlanEdge[] = [];
        const isLinked = (sourceId: string, good: string) =>
          [...edges, ...newEdges].some(
            (e) =>
              e.source === sourceId &&
              e.target === id &&
              e.targetHandle === inHandle(good),
          );
        const connect = (sourceId: string, good: string) => {
          if (isLinked(sourceId, good)) return;
          newEdges.push({
            id: `e-${newId()}`,
            type: "flow",
            source: sourceId,
            sourceHandle: outHandle(good),
            target: id,
            targetHandle: inHandle(good),
          });
        };

        missing.forEach((input, index) => {
          let shortfall = input.nominal - input.actual;
          const producers = nodes.filter(
            (n): n is BuildingNode =>
              n.type === "building" &&
              n.id !== id &&
              (buildingsById
                .get(n.data.buildingId)
                ?.outputs.some((o) => o.good === input.good) ??
                false),
          );

          // 1. Tap spare output of producers already on the canvas.
          const withSpare = producers
            .map((producer) => ({
              producer,
              spare: spareOutput(flow, edges, producer.id, input.good),
            }))
            .filter(({ spare }) => spare > 1e-6)
            .sort((a, b) => b.spare - a.spare);
          for (const { producer, spare } of withSpare) {
            if (shortfall <= 1e-6) break;
            connect(producer.id, input.good);
            shortfall -= spare;
            result.connected++;
          }
          if (shortfall <= 1e-6) return;

          // 2. Grow an existing producer, preferring one already wired here.
          const grow =
            producers.find((p) => isLinked(p.id, input.good)) ?? producers[0];
          if (grow) {
            nextNodes[nextNodes.findIndex((n) => n.id === grow.id)] = {
              ...grow,
              data: {
                ...grow.data,
                count:
                  grow.data.count +
                  buildingsFor(
                    shortfall,
                    grow.data.buildingId,
                    grow.data.productivity,
                  ),
              },
            };
            connect(grow.id, input.good);
            result.expanded++;
            return;
          }

          // 3. Nothing on the canvas makes it yet: add a new producer.
          const producer = producersOf(input.good)[0];
          if (!producer) return;
          const supplierId = newId();
          nextNodes.push({
            id: supplierId,
            type: "building",
            // Same island as the node it supplies.
            parentId: node.parentId,
            position: {
              x: node.position.x - 340,
              y: node.position.y + (index - (missing.length - 1) / 2) * 220,
            },
            data: {
              buildingId: producer.id,
              count: buildingsFor(shortfall, producer.id),
              productivity: 100,
            },
          });
          connect(supplierId, input.good);
          result.added++;
        });
        const allEdges = [...edges, ...newEdges];
        // Report suppliers of this node that are short on their own inputs.
        const real = computeFlow(nextNodes, allEdges);
        result.starved = new Set(
          allEdges
            .filter(
              (e) =>
                e.target === id &&
                (real.nodes.get(e.source)?.efficiency ?? 1) < 0.999,
            )
            .map((e) => e.source),
        ).size;
        set({ nodes: nextNodes, edges: allEdges });
        return result;
      },
      autoArrange: false,
      paletteGrouping: "tier",
      setPaletteGrouping: (paletteGrouping) => set({ paletteGrouping }),
      setAutoArrange: (autoArrange) => set({ autoArrange }),
      arrange: () => set({ nodes: arrangeNodes(get().nodes, get().edges) }),
      addIsland: (position) => {
        const id = newId();
        set({
          nodes: sortParentsFirst([
            ...get().nodes,
            newIsland(get().nodes, id, position),
          ]),
        });
        return id;
      },
      groupIntoIsland: (ids) =>
        set({ nodes: groupIntoIsland(get().nodes, ids, newId()) }),
      ungroupIsland: (id) => set({ nodes: ungroupIsland(get().nodes, id) }),
      reparentNodes: (ids) => set({ nodes: reparent(get().nodes, ids) }),
      removeFromIsland: (ids) => set({ nodes: detach(get().nodes, ids) }),
      importPlan: (plan) =>
        set({ nodes: sortParentsFirst(plan.nodes), edges: plan.edges }),
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
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        autoArrange: state.autoArrange,
        paletteGrouping: state.paletteGrouping,
      }),
    },
  ),
);
